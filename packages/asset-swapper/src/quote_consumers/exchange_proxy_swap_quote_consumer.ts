import { ContractAddresses } from '@0x/contract-addresses';
import { ITransformERC20Contract } from '@0x/contract-wrappers';
import {
    encodeFillQuoteTransformerData,
    encodePayTakerTransformerData,
    encodeWethTransformerData,
    ETH_TOKEN_ADDRESS,
    FillQuoteTransformerSide,
} from '@0x/contracts-zero-ex';
import { assetDataUtils, ERC20AssetData } from '@0x/order-utils';
import { AssetProxyId } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from '@0x/web3-wrapper';
import * as ethjs from 'ethereumjs-util';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalldataInfo,
    MarketBuySwapQuote,
    MarketOperation,
    MarketSellSwapQuote,
    SwapQuote,
    SwapQuoteConsumerBase,
    SwapQuoteConsumerOpts,
    SwapQuoteExecutionOpts,
    SwapQuoteGetOutputOpts,
} from '../types';
import { assert } from '../utils/assert';

// tslint:disable-next-line:custom-no-magic-numbers
const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);
const { NULL_ADDRESS } = constants;
const MAX_NONCE_GUESSES = 2048;

export class ExchangeProxySwapQuoteConsumer implements SwapQuoteConsumerBase {
    public readonly provider: ZeroExProvider;
    public readonly chainId: number;
    public readonly transformerNonces: {
        wethTransformer: number;
        payTakerTransformer: number;
        fillQuoteTransformer: number;
    };

    private readonly _transformFeature: ITransformERC20Contract;

    constructor(
        supportedProvider: SupportedProvider,
        public readonly contractAddresses: ContractAddresses,
        options: Partial<SwapQuoteConsumerOpts> = {},
    ) {
        const { chainId } = _.merge({}, constants.DEFAULT_SWAP_QUOTER_OPTS, options);
        assert.isNumber('chainId', chainId);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        this.provider = provider;
        this.chainId = chainId;
        this.contractAddresses = contractAddresses;
        this._transformFeature = new ITransformERC20Contract(contractAddresses.exchangeProxy, supportedProvider);
        this.transformerNonces = {
            wethTransformer: findTransformerNonce(
                contractAddresses.transformers.wethTransformer,
                contractAddresses.exchangeProxyTransformerDeployer,
            ),
            payTakerTransformer: findTransformerNonce(
                contractAddresses.transformers.payTakerTransformer,
                contractAddresses.exchangeProxyTransformerDeployer,
            ),
            fillQuoteTransformer: findTransformerNonce(
                contractAddresses.transformers.fillQuoteTransformer,
                contractAddresses.exchangeProxyTransformerDeployer,
            ),
        };
    }

    public async getCalldataOrThrowAsync(
        quote: MarketBuySwapQuote | MarketSellSwapQuote,
        opts: Partial<SwapQuoteGetOutputOpts> = {},
    ): Promise<CalldataInfo> {
        assert.isValidSwapQuote('quote', quote);
        const { isFromETH, isToETH } = {
            ...constants.DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS,
            extensionContractOpts: {
                isFromETH: false,
                isToETH: false,
            },
            ...opts,
        }.extensionContractOpts;

        const sellToken = getTokenFromAssetData(quote.takerAssetData);
        const buyToken = getTokenFromAssetData(quote.makerAssetData);

        // Build up the transforms.
        const transforms = [];
        if (isFromETH) {
            // Create a WETH wrapper if coming from ETH.
            transforms.push({
                deploymentNonce: this.transformerNonces.wethTransformer,
                data: encodeWethTransformerData({
                    token: ETH_TOKEN_ADDRESS,
                    amount: quote.worstCaseQuoteInfo.totalTakerAssetAmount,
                }),
            });
        }

        // This transformer will fill the quote.
        transforms.push({
            deploymentNonce: this.transformerNonces.fillQuoteTransformer,
            data: encodeFillQuoteTransformerData({
                sellToken,
                buyToken,
                side: isBuyQuote(quote) ? FillQuoteTransformerSide.Buy : FillQuoteTransformerSide.Sell,
                fillAmount: isBuyQuote(quote) ? quote.makerAssetFillAmount : quote.takerAssetFillAmount,
                maxOrderFillAmounts: [],
                orders: quote.orders,
                signatures: quote.orders.map(o => o.signature),
            }),
        });

        if (isToETH) {
            // Create a WETH unwrapper if going to ETH.
            transforms.push({
                deploymentNonce: this.transformerNonces.wethTransformer,
                data: encodeWethTransformerData({
                    token: this.contractAddresses.etherToken,
                    amount: MAX_UINT256,
                }),
            });
        }

        // The final transformer will send all funds to the taker.
        transforms.push({
            deploymentNonce: this.transformerNonces.payTakerTransformer,
            data: encodePayTakerTransformerData({
                tokens: [sellToken, buyToken, ETH_TOKEN_ADDRESS],
                amounts: [],
            }),
        });

        const calldataHexString = this._transformFeature
            .transformERC20(
                isFromETH ? ETH_TOKEN_ADDRESS : sellToken,
                isToETH ? ETH_TOKEN_ADDRESS : buyToken,
                quote.worstCaseQuoteInfo.totalTakerAssetAmount,
                quote.worstCaseQuoteInfo.makerAssetAmount,
                transforms,
            )
            .getABIEncodedTransactionData();

        let ethAmount = quote.worstCaseQuoteInfo.protocolFeeInWeiAmount;
        if (isFromETH) {
            ethAmount = ethAmount.plus(quote.worstCaseQuoteInfo.takerAssetAmount);
        }

        return {
            calldataHexString,
            ethAmount,
            toAddress: this._transformFeature.address,
            allowanceTarget: this.contractAddresses.exchangeProxyAllowanceTarget,
        };
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async executeSwapQuoteOrThrowAsync(
        _quote: SwapQuote,
        _opts: Partial<SwapQuoteExecutionOpts>,
    ): Promise<string> {
        throw new Error('Execution not supported for Exchange Proxy quotes');
    }
}

function isBuyQuote(quote: SwapQuote): quote is MarketBuySwapQuote {
    return quote.type === MarketOperation.Buy;
}

function getTokenFromAssetData(assetData: string): string {
    const data = assetDataUtils.decodeAssetDataOrThrow(assetData);
    if (data.assetProxyId !== AssetProxyId.ERC20) {
        throw new Error(`Unsupported exchange proxy quote asset type: ${data.assetProxyId}`);
    }
    // tslint:disable-next-line:no-unnecessary-type-assertion
    return (data as ERC20AssetData).tokenAddress;
}

/**
 * Find the nonce for a transformer given its deployer.
 * If `deployer` is the null address, zero will always be returned.
 */
export function findTransformerNonce(transformer: string, deployer: string = NULL_ADDRESS): number {
    if (deployer === NULL_ADDRESS) {
        return 0;
    }
    const lowercaseTransformer = transformer.toLowerCase();
    // Try to guess the nonce.
    for (let nonce = 0; nonce < MAX_NONCE_GUESSES; ++nonce) {
        const deployedAddress = getTransformerAddress(deployer, nonce);
        if (deployedAddress === lowercaseTransformer) {
            return nonce;
        }
    }
    throw new Error(`${deployer} did not deploy ${transformer}!`);
}

/**
 * Compute the deployed address for a transformer given a deployer and nonce.
 */
export function getTransformerAddress(deployer: string, nonce: number): string {
    return ethjs.bufferToHex(
        // tslint:disable-next-line: custom-no-magic-numbers
        ethjs.rlphash([deployer, nonce] as any).slice(12),
    );
}
