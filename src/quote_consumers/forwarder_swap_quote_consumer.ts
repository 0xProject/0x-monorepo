import { ContractWrappers, ContractWrappersError, ForwarderWrapperError } from '@0x/contract-wrappers';
import { calldataOptimizationUtils } from '@0x/contract-wrappers/lib/src/utils/calldata_optimization_utils';
import { MarketOperation } from '@0x/types';
import { AbiEncoder, providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from '@0x/web3-wrapper';
import { MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalldataInfo,
    ForwarderSmartContractParams,
    ForwarderSwapQuoteExecutionOpts,
    ForwarderSwapQuoteGetOutputOpts,
    SmartContractParamsInfo,
    SwapQuote,
    SwapQuoteConsumerBase,
    SwapQuoteConsumerError,
    SwapQuoteConsumerOpts,
} from '../types';
import { affiliateFeeUtils } from '../utils/affiliate_fee_utils';
import { assert } from '../utils/assert';
import { assetDataUtils } from '../utils/asset_data_utils';
import { swapQuoteConsumerUtils } from '../utils/swap_quote_consumer_utils';
import { utils } from '../utils/utils';

export class ForwarderSwapQuoteConsumer implements SwapQuoteConsumerBase<ForwarderSmartContractParams> {
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

        const { to, methodAbi, ethAmount, params } = await this.getSmartContractParamsOrThrowAsync(quote, opts);

        const abiEncoder = new AbiEncoder.Method(methodAbi);
        const { orders, signatures, feeOrders, feeSignatures, feePercentage, feeRecipient } = params;

        let args: any[];
        if (params.type === MarketOperation.Buy) {
            const { makerAssetFillAmount } = params;
            args = [orders, makerAssetFillAmount, signatures, feeOrders, feeSignatures, feePercentage, feeRecipient];
        } else {
            args = [orders, signatures, feeOrders, feeSignatures, feePercentage, feeRecipient];
        }
        const calldataHexString = abiEncoder.encode(args, { shouldOptimize: true });
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
    ): Promise<SmartContractParamsInfo<ForwarderSmartContractParams>> {
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

        const quoteWithAffiliateFee = affiliateFeeUtils.getSwapQuoteWithAffiliateFee(quote, unFormattedFeePercentage);

        const { orders, feeOrders, worstCaseQuoteInfo } = quoteWithAffiliateFee;

        // lowercase input addresses
        const normalizedFeeRecipientAddress = feeRecipient.toLowerCase();
        // optimize orders
        const optimizedOrders = calldataOptimizationUtils.optimizeForwarderOrders(orders);
        const optimizedFeeOrders = calldataOptimizationUtils.optimizeForwarderFeeOrders(feeOrders);

        const signatures = _.map(orders, o => o.signature);
        const feeSignatures = _.map(feeOrders, o => o.signature);

        const feePercentage = utils.numberPercentageToEtherTokenAmountPercentage(unFormattedFeePercentage);

        let params: ForwarderSmartContractParams;
        let methodName: string;

        if (quoteWithAffiliateFee.type === MarketOperation.Buy) {
            const { makerAssetFillAmount } = quoteWithAffiliateFee;

            params = {
                orders: optimizedOrders,
                makerAssetFillAmount,
                signatures,
                feeOrders: optimizedFeeOrders,
                feeSignatures,
                feePercentage,
                feeRecipient: normalizedFeeRecipientAddress,
                type: MarketOperation.Buy,
            };

            methodName = 'marketBuyOrdersWithEth';
        } else {
            params = {
                orders: optimizedOrders,
                signatures,
                feeOrders: optimizedFeeOrders,
                feeSignatures,
                feePercentage,
                feeRecipient: normalizedFeeRecipientAddress,
                type: MarketOperation.Sell,
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

        const quoteWithAffiliateFee = affiliateFeeUtils.getSwapQuoteWithAffiliateFee(quote, feePercentage);

        const { orders, feeOrders, worstCaseQuoteInfo } = quoteWithAffiliateFee;

        const finalTakerAddress = await swapQuoteConsumerUtils.getTakerAddressOrThrowAsync(this.provider, opts);

        try {
            let txHash: string;
            if (quoteWithAffiliateFee.type === MarketOperation.Buy) {
                const { makerAssetFillAmount } = quoteWithAffiliateFee;
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
