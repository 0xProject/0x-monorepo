import { ContractAddresses } from '@0x/contract-addresses';
import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { ForwarderContract } from '@0x/contracts-exchange-forwarder';
import { AbiEncoder, providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from '@0x/web3-wrapper';
import { MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalldataInfo,
    ForwarderExtensionContractOpts,
    ForwarderSmartContractParams,
    MarketOperation,
    SmartContractParamsInfo,
    SwapQuote,
    SwapQuoteConsumerBase,
    SwapQuoteConsumerOpts,
    SwapQuoteExecutionOpts,
    SwapQuoteGetOutputOpts,
} from '../types';
import { affiliateFeeUtils } from '../utils/affiliate_fee_utils';
import { assert } from '../utils/assert';
import { swapQuoteConsumerUtils } from '../utils/swap_quote_consumer_utils';
import { utils } from '../utils/utils';

export class ForwarderSwapQuoteConsumer implements SwapQuoteConsumerBase<ForwarderSmartContractParams> {
    public readonly provider: ZeroExProvider;
    public readonly chainId: number;

    private readonly _contractAddresses: ContractAddresses;
    private readonly _forwarder: ForwarderContract;
    private readonly _devUtils: DevUtilsContract;

    constructor(
        supportedProvider: SupportedProvider,
        contractAddresses: ContractAddresses,
        options: Partial<SwapQuoteConsumerOpts> = {},
    ) {
        const { chainId } = _.merge({}, constants.DEFAULT_SWAP_QUOTER_OPTS, options);
        assert.isNumber('chainId', chainId);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        this.provider = provider;
        this.chainId = chainId;
        this._contractAddresses = contractAddresses;
        this._forwarder = new ForwarderContract(contractAddresses.forwarder, supportedProvider);
        this._devUtils = new DevUtilsContract(contractAddresses.devUtils, supportedProvider);
    }

    /**
     * Given a SwapQuote, returns 'CalldataInfo' for a forwarder extension call. See type definition of CalldataInfo for more information.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting CalldataInfo. See type definition for more information.
     */
    public async getCalldataOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetOutputOpts> = {},
    ): Promise<CalldataInfo> {
        assert.isValidForwarderSwapQuote('quote', quote, await this._getEtherTokenAssetDataOrThrowAsync());

        const { toAddress, methodAbi, ethAmount, params } = await this.getSmartContractParamsOrThrowAsync(quote, opts);

        const abiEncoder = new AbiEncoder.Method(methodAbi);
        const { orders, signatures, feePercentage, feeRecipient } = params;

        let args: any[];
        if (params.type === MarketOperation.Buy) {
            const { makerAssetFillAmount } = params;
            args = [orders, makerAssetFillAmount, signatures, feePercentage, feeRecipient];
        } else {
            args = [orders, signatures, feePercentage, feeRecipient];
        }
        const calldataHexString = abiEncoder.encode(args, { shouldOptimize: true });
        return {
            calldataHexString,
            methodAbi,
            toAddress,
            ethAmount,
        };
    }

    /**
     * Given a SwapQuote, returns 'SmartContractParamsInfo' for a forwarder extension call. See type definition of CalldataInfo for more information.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting SmartContractParams. See type definition for more information.
     */
    public async getSmartContractParamsOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetOutputOpts> = {},
    ): Promise<SmartContractParamsInfo<ForwarderSmartContractParams>> {
        assert.isValidForwarderSwapQuote('quote', quote, await this._getEtherTokenAssetDataOrThrowAsync());

        const { extensionContractOpts } = _.merge(
            {},
            constants.DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS,
            opts,
        );

        assert.isValidForwarderExtensionContractOpts('extensionContractOpts', extensionContractOpts);

        const { feeRecipient, feePercentage } = extensionContractOpts;

        const { orders, worstCaseQuoteInfo } = quote;

        // lowercase input addresses
        const normalizedFeeRecipientAddress = feeRecipient.toLowerCase();

        const signatures = _.map(orders, o => o.signature);

        const formattedFeePercentage = utils.numberPercentageToEtherTokenAmountPercentage(feePercentage);

        let params: ForwarderSmartContractParams;
        let methodName: string;

        if (quote.type === MarketOperation.Buy) {
            const { makerAssetFillAmount } = quote;

            params = {
                orders,
                makerAssetFillAmount,
                signatures,
                feePercentage: formattedFeePercentage,
                feeRecipient: normalizedFeeRecipientAddress,
                type: MarketOperation.Buy,
            };

            methodName = 'marketBuyOrdersWithEth';
        } else {
            params = {
                orders,
                signatures,
                feePercentage: formattedFeePercentage,
                feeRecipient: normalizedFeeRecipientAddress,
                type: MarketOperation.Sell,
            };
            methodName = 'marketSellOrdersWithEth';
        }
        const methodAbi = utils.getMethodAbiFromContractAbi(this._forwarder.abi, methodName) as MethodAbi;

        const ethAmountWithFees = affiliateFeeUtils.getTotalEthAmountWithAffiliateFee(
            worstCaseQuoteInfo,
            feePercentage,
        );
        return {
            params,
            toAddress: this._forwarder.address,
            ethAmount: ethAmountWithFees,
            methodAbi,
        };
    }

    /**
     * Given a SwapQuote and desired rate (in Eth), attempt to execute the swap.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting CalldataInfo. See type definition for more information.
     */
    public async executeSwapQuoteOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteExecutionOpts>,
    ): Promise<string> {
        assert.isValidForwarderSwapQuote('quote', quote, await this._getEtherTokenAssetDataOrThrowAsync());

        const { ethAmount: providedEthAmount, takerAddress, gasLimit, extensionContractOpts } = _.merge(
            {},
            constants.DEFAULT_FORWARDER_SWAP_QUOTE_EXECUTE_OPTS,
            opts,
        );

        assert.isValidForwarderExtensionContractOpts('extensionContractOpts', extensionContractOpts);

        const { feeRecipient, feePercentage } = extensionContractOpts;

        if (providedEthAmount !== undefined) {
            assert.isBigNumber('ethAmount', providedEthAmount);
        }
        if (takerAddress !== undefined) {
            assert.isETHAddressHex('takerAddress', takerAddress);
        }
        if (gasLimit !== undefined) {
            assert.isNumber('gasLimit', gasLimit);
        }
        const { orders, worstCaseQuoteInfo, gasPrice } = quote; // tslint:disable-line:no-unused-variable

        // get taker address
        const finalTakerAddress = await swapQuoteConsumerUtils.getTakerAddressOrThrowAsync(this.provider, opts);
        // if no ethAmount is provided, default to the worst totalTakerAssetAmount
        const ethAmountWithFees = affiliateFeeUtils.getTotalEthAmountWithAffiliateFee(
            worstCaseQuoteInfo,
            feePercentage,
        );
        // format fee percentage
        const formattedFeePercentage = utils.numberPercentageToEtherTokenAmountPercentage(feePercentage);
        let txHash: string;
        if (quote.type === MarketOperation.Buy) {
            const { makerAssetFillAmount } = quote;
            txHash = await this._forwarder
                .marketBuyOrdersWithEth(
                    orders,
                    makerAssetFillAmount,
                    orders.map(o => o.signature),
                    formattedFeePercentage,
                    feeRecipient,
                )
                .sendTransactionAsync({
                    from: finalTakerAddress,
                    gas: gasLimit,
                    gasPrice,
                    value: providedEthAmount || ethAmountWithFees,
                });
        } else {
            txHash = await this._forwarder
                .marketSellOrdersWithEth(orders, orders.map(o => o.signature), formattedFeePercentage, feeRecipient)
                .sendTransactionAsync({
                    from: finalTakerAddress,
                    gas: gasLimit,
                    gasPrice,
                    value: providedEthAmount || ethAmountWithFees,
                });
        }
        // TODO(dorothy-zbornak): Handle signature request denied
        // (see contract-wrappers/decorators)
        // and ForwarderRevertErrors.CompleteBuyFailed.
        return txHash;
    }

    private async _getEtherTokenAssetDataOrThrowAsync(): Promise<string> {
        return this._devUtils.encodeERC20AssetData(this._contractAddresses.etherToken).callAsync();
    }
}
