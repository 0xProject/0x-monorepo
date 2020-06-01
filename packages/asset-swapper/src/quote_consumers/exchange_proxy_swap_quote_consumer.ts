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
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalldataInfo,
    ExchangeProxyContractOpts,
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

export class ExchangeProxySwapQuoteConsumer implements SwapQuoteConsumerBase {
    public readonly provider: ZeroExProvider;
    public readonly chainId: number;

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
    }

    public async getCalldataOrThrowAsync(
        quote: MarketBuySwapQuote | MarketSellSwapQuote,
        opts: Partial<SwapQuoteGetOutputOpts> = {},
    ): Promise<CalldataInfo> {
        assert.isValidSwapQuote('quote', quote);
        const exchangeProxyOpts = {
            ...constants.DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS,
            ...{
                isFromETH: false,
                isToETH: false,
            },
            ...opts,
        }.extensionContractOpts as ExchangeProxyContractOpts;

        const sellToken = getTokenFromAssetData(quote.takerAssetData);
        const buyToken = getTokenFromAssetData(quote.makerAssetData);

        // Build up the transforms.
        const transforms = [];
        if (exchangeProxyOpts.isFromETH) {
            // Create a WETH wrapper if coming from ETH.
            transforms.push({
                transformer: this.contractAddresses.transformers.wethTransformer,
                data: encodeWethTransformerData({
                    token: ETH_TOKEN_ADDRESS,
                    amount: quote.worstCaseQuoteInfo.totalTakerAssetAmount,
                }),
            });
        }

        // This transformer will fill the quote.
        transforms.push({
            transformer: this.contractAddresses.transformers.fillQuoteTransformer,
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

        if (exchangeProxyOpts.isToETH) {
            // Create a WETH unwrapper if going to ETH.
            transforms.push({
                transformer: this.contractAddresses.transformers.wethTransformer,
                data: encodeWethTransformerData({
                    token: this.contractAddresses.etherToken,
                    amount: MAX_UINT256,
                }),
            });
        }

        // The final transformer will send all funds to the taker.
        transforms.push({
            transformer: this.contractAddresses.transformers.payTakerTransformer,
            data: encodePayTakerTransformerData({
                tokens: [sellToken, buyToken, ETH_TOKEN_ADDRESS],
                amounts: [],
            }),
        });

        const calldataHexString = this._transformFeature
            .transformERC20(
                sellToken,
                buyToken,
                quote.worstCaseQuoteInfo.totalTakerAssetAmount,
                quote.worstCaseQuoteInfo.makerAssetAmount,
                transforms,
            )
            .getABIEncodedTransactionData();

        return {
            calldataHexString,
            ethAmount: quote.worstCaseQuoteInfo.protocolFeeInWeiAmount,
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
