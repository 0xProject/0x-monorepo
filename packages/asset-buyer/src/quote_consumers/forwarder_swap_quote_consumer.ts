import { ContractWrappers, ContractWrappersError, ForwarderWrapperError } from '@0x/contract-wrappers';
import { AbiEncoder, providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from '@0x/web3-wrapper';
import { MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalldataInfo,
    ForwarderMarketBuySmartContractParams,
    ForwarderMarketSellSmartContractParams,
    ForwarderSwapQuoteExecutionOpts,
    ForwarderSwapQuoteGetOutputOpts,
    MarketBuySwapQuote,
    MarketSellSwapQuote,
    SmartContractParamsInfo,
    SwapQuote,
    SwapQuoteConsumer,
    SwapQuoteConsumerError,
    SwapQuoteConsumerOpts,
} from '../types';
import { affiliateFeeUtils } from '../utils/affiliate_fee_utils';
import { assert } from '../utils/assert';
import { assetDataUtils } from '../utils/asset_data_utils';
import { swapQuoteConsumerUtils } from '../utils/swap_quote_consumer_utils';
import { utils } from '../utils/utils';

export class ForwarderSwapQuoteConsumer
    implements SwapQuoteConsumer<ForwarderMarketBuySmartContractParams | ForwarderMarketSellSmartContractParams> {
    public readonly provider: ZeroExProvider;
    public readonly networkId: number;

    private readonly _contractWrappers: ContractWrappers;

    constructor(supportedProvider: SupportedProvider, options: Partial<SwapQuoteConsumerOpts> = {}) {
        const { networkId } = _.merge({}, constants.DEFAULT_SWAP_QUOTER_OPTS, options);
        assert.isNumber('networkId', networkId);

        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        this.provider = provider;
        this.networkId = networkId;
        this._contractWrappers = new ContractWrappers(this.provider, {
            networkId,
        });
    }

    /**
     * Given a SwapQuote, returns 'CalldataInfo' for a forwarder extension call. See type definition of CalldataInfo for more information.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting CalldataInfo. See type definition for more information.
     */
    public async getCalldataOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<ForwarderSwapQuoteGetOutputOpts>,
    ): Promise<CalldataInfo> {
        assert.isValidForwarderSwapQuote('quote', quote, this._getEtherTokenAssetDataOrThrow());

        const consumableQuote = (quote as any) as (MarketBuySwapQuote | MarketSellSwapQuote);
        const smartContractParamsInfo = await this.getSmartContractParamsOrThrowAsync(consumableQuote, opts);
        const { to, methodAbi, ethAmount } = smartContractParamsInfo;

        const abiEncoder = new AbiEncoder.Method(methodAbi);

        let args: any[];
        if (utils.isSwapQuoteMarketBuy(consumableQuote)) {
            const marketBuyParams = (smartContractParamsInfo.params as any) as ForwarderMarketBuySmartContractParams;
            args = [
                marketBuyParams.orders,
                marketBuyParams.makerAssetFillAmount,
                marketBuyParams.signatures,
                marketBuyParams.feeOrders,
                marketBuyParams.feeSignatures,
                marketBuyParams.feePercentage,
                marketBuyParams.feeRecipient,
            ];
        } else {
            const marketSellParams = (smartContractParamsInfo.params as any) as ForwarderMarketSellSmartContractParams;
            args = [
                marketSellParams.orders,
                marketSellParams.signatures,
                marketSellParams.feeOrders,
                marketSellParams.feeSignatures,
                marketSellParams.feePercentage,
                marketSellParams.feeRecipient,
            ];
        }
        const calldataHexString = abiEncoder.encode(args);
        return {
            calldataHexString,
            methodAbi,
            to,
            ethAmount,
        };
    }

    /**
     * Given a SwapQuote, returns 'SmartContractParamsInfo' for a forwarder extension call. See type definition of CalldataInfo for more information.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting CalldataInfo. See type definition for more information.
     */
    public async getSmartContractParamsOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<ForwarderSwapQuoteGetOutputOpts>,
    ): Promise<
        SmartContractParamsInfo<ForwarderMarketBuySmartContractParams | ForwarderMarketSellSmartContractParams>
    > {
        assert.isValidForwarderSwapQuote('quote', quote, this._getEtherTokenAssetDataOrThrow());

        const { ethAmount, feeRecipient, feePercentage: unFormattedFeePercentage } = _.merge(
            {},
            constants.DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS,
            opts,
        );

        assert.isValidPercentage('feePercentage', unFormattedFeePercentage);
        assert.isETHAddressHex('feeRecipient', feeRecipient);
        if (ethAmount !== undefined) {
            assert.isBigNumber('ethAmount', ethAmount);
        }

        const swapQuoteWithAffiliateFee = affiliateFeeUtils.getSwapQuoteWithAffiliateFee(
            quote,
            unFormattedFeePercentage,
        );

        const consumableQuoteWithAffiliateFee = (swapQuoteWithAffiliateFee as any) as (
            | MarketBuySwapQuote
            | MarketSellSwapQuote);

        const { orders, feeOrders, worstCaseQuoteInfo } = swapQuoteWithAffiliateFee;

        const signatures = _.map(orders, o => o.signature);
        const feeSignatures = _.map(feeOrders, o => o.signature);

        const feePercentage = utils.numberPercentageToEtherTokenAmountPercentage(unFormattedFeePercentage);

        let params: ForwarderMarketBuySmartContractParams | ForwarderMarketSellSmartContractParams;
        let methodName: string;

        if (utils.isSwapQuoteMarketBuy(consumableQuoteWithAffiliateFee)) {
            const { makerAssetFillAmount } = consumableQuoteWithAffiliateFee;

            params = {
                orders,
                makerAssetFillAmount,
                signatures,
                feeOrders,
                feeSignatures,
                feePercentage,
                feeRecipient,
            };

            methodName = 'marketBuyOrdersWithEth';
        } else {
            const { takerAssetFillAmount } = consumableQuoteWithAffiliateFee;

            params = {
                orders,
                takerAssetFillAmount,
                signatures,
                feeOrders,
                feeSignatures,
                feePercentage,
                feeRecipient,
            };
            methodName = 'marketSellOrdersWithEth';
        }
        const methodAbi = utils.getMethodAbiFromContractAbi(
            this._contractWrappers.forwarder.abi,
            methodName,
        ) as MethodAbi;

        return {
            params,
            to: this._contractWrappers.forwarder.address,
            ethAmount: ethAmount || worstCaseQuoteInfo.totalTakerTokenAmount,
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
        opts: Partial<ForwarderSwapQuoteExecutionOpts>,
    ): Promise<string> {
        assert.isValidForwarderSwapQuote('quote', quote, this._getEtherTokenAssetDataOrThrow());

        const { ethAmount, takerAddress, gasLimit, gasPrice, feeRecipient, feePercentage } = _.merge(
            {},
            constants.DEFAULT_FORWARDER_SWAP_QUOTE_EXECUTE_OPTS,
            opts,
        );

        assert.isValidPercentage('feePercentage', feePercentage);
        assert.isETHAddressHex('feeRecipient', feeRecipient);
        if (ethAmount !== undefined) {
            assert.isBigNumber('ethAmount', ethAmount);
        }
        if (takerAddress !== undefined) {
            assert.isETHAddressHex('takerAddress', takerAddress);
        }
        if (gasLimit !== undefined) {
            assert.isNumber('gasLimit', gasLimit);
        }
        if (gasPrice !== undefined) {
            assert.isBigNumber('gasPrice', gasPrice);
        }

        const swapQuoteWithAffiliateFee = affiliateFeeUtils.getSwapQuoteWithAffiliateFee(quote, feePercentage);

        const consumableQuoteWithAffiliateFee = (swapQuoteWithAffiliateFee as any) as (
            | MarketBuySwapQuote
            | MarketSellSwapQuote);

        const { orders, feeOrders, worstCaseQuoteInfo } = consumableQuoteWithAffiliateFee;

        const finalTakerAddress = await swapQuoteConsumerUtils.getTakerAddressOrThrowAsync(this.provider, opts);

        try {
            let txHash: string;
            if (utils.isSwapQuoteMarketBuy(consumableQuoteWithAffiliateFee)) {
                const { makerAssetFillAmount } = consumableQuoteWithAffiliateFee;
                txHash = await this._contractWrappers.forwarder.marketBuyOrdersWithEthAsync(
                    orders,
                    makerAssetFillAmount,
                    finalTakerAddress,
                    ethAmount || worstCaseQuoteInfo.totalTakerTokenAmount,
                    feeOrders,
                    feePercentage,
                    feeRecipient,
                    {
                        gasLimit,
                        gasPrice,
                        shouldValidate: true,
                    },
                );
            } else {
                txHash = await this._contractWrappers.forwarder.marketSellOrdersWithEthAsync(
                    orders,
                    finalTakerAddress,
                    ethAmount || worstCaseQuoteInfo.totalTakerTokenAmount,
                    feeOrders,
                    feePercentage,
                    feeRecipient,
                    {
                        gasLimit,
                        gasPrice,
                        shouldValidate: true,
                    },
                );
            }
            return txHash;
        } catch (err) {
            if (_.includes(err.message, ContractWrappersError.SignatureRequestDenied)) {
                throw new Error(SwapQuoteConsumerError.SignatureRequestDenied);
            } else if (_.includes(err.message, ForwarderWrapperError.CompleteFillFailed)) {
                throw new Error(SwapQuoteConsumerError.TransactionValueTooLow);
            } else {
                throw err;
            }
        }
    }

    private _getEtherTokenAssetDataOrThrow(): string {
        return assetDataUtils.getEtherTokenAssetData(this._contractWrappers);
    }
}
