import { ContractWrappers, ContractWrappersError, ForwarderWrapperError, SignedOrder } from '@0x/contract-wrappers';
import { AbiEncoder, BigNumber, providerUtils } from '@0x/utils';
import { SupportedProvider, Web3Wrapper, ZeroExProvider } from '@0x/web3-wrapper';
import { MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalldataInfo,
    ForwarderMarketBuySmartContractParams,
    ForwarderSwapQuoteExecutionOpts,
    ForwarderSwapQuoteGetOutputOpts,
    SmartContractParamsInfo,
    SwapQuote,
    SwapQuoteConsumer,
    SwapQuoteConsumerError,
    SwapQuoteConsumerOpts,
} from '../types';
import { affiliateFeeUtils } from '../utils/affiliate_fee_utils';
import { assert } from '../utils/assert';
import { assetDataUtils } from '../utils/asset_data_utils';
import { utils } from '../utils/utils';

export class ForwarderSwapQuoteConsumer implements SwapQuoteConsumer<ForwarderMarketBuySmartContractParams> {
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
    public getCalldataOrThrow(quote: SwapQuote, opts: Partial<ForwarderSwapQuoteGetOutputOpts>): CalldataInfo {
        assert.isValidForwarderSwapQuote('quote', quote, this._getEtherTokenAssetDataOrThrow());

        const { params, to, ethAmount, methodAbi } = this.getSmartContractParamsOrThrow(quote, opts);
        const abiEncoder = new AbiEncoder.Method(methodAbi);
        const args = [
            params.orders,
            params.makerAssetFillAmount,
            params.signatures,
            params.feeOrders,
            params.feeSignatures,
            params.feePercentage,
            params.feeRecipient,
        ];
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
    public getSmartContractParamsOrThrow(
        quote: SwapQuote,
        opts: Partial<ForwarderSwapQuoteGetOutputOpts>,
    ): SmartContractParamsInfo<ForwarderMarketBuySmartContractParams> {
        assert.isValidForwarderSwapQuote('quote', quote, this._getEtherTokenAssetDataOrThrow());

        const { ethAmount, feeRecipient, feePercentage: unFormattedFeePercentage } = _.merge(
            {},
            constants.DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS,
            opts,
        );

        assert.isNumber('feePercentage', unFormattedFeePercentage);
        assert.isETHAddressHex('feeRecipient', feeRecipient);
        if (ethAmount !== undefined) {
            assert.isBigNumber('ethAmount', ethAmount);
        }

        const swapQuoteWithAffiliateFee = affiliateFeeUtils.getSwapQuoteWithAffiliateFee(
            quote,
            unFormattedFeePercentage,
        );

        const { orders, feeOrders, makerAssetFillAmount, worstCaseQuoteInfo } = swapQuoteWithAffiliateFee;

        const signatures = _.map(orders, o => o.signature);
        const feeSignatures = _.map(feeOrders, o => o.signature);

        const feePercentage = utils.numberPercentageToEtherTokenAmountPercentage(unFormattedFeePercentage);

        const params: ForwarderMarketBuySmartContractParams = {
            orders,
            makerAssetFillAmount,
            signatures,
            feeOrders,
            feeSignatures,
            feePercentage,
            feeRecipient,
        };

        const methodAbi = utils.getMethodAbiFromContractAbi(
            this._contractWrappers.forwarder.abi,
            'marketBuyOrdersWithEth',
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

        assert.isNumber('feePercentage', feePercentage);
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

        const { orders, feeOrders, makerAssetFillAmount, worstCaseQuoteInfo } = swapQuoteWithAffiliateFee;

        const finalTakerAddress = await this._getTakerAddressOrThrowAsync(opts);

        try {
            const txHash = await this._contractWrappers.forwarder.marketBuyOrdersWithEthAsync(
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

    private async _getTakerAddressOrThrowAsync(opts: Partial<ForwarderSwapQuoteExecutionOpts>): Promise<string> {
        if (opts.takerAddress !== undefined) {
            return opts.takerAddress;
        } else {
            const web3Wrapper = new Web3Wrapper(this.provider);
            const availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
            const firstAvailableAddress = _.head(availableAddresses);
            if (firstAvailableAddress !== undefined) {
                return firstAvailableAddress;
            } else {
                throw new Error(SwapQuoteConsumerError.NoAddressAvailable);
            }
        }
    }

    /**
     * Get the assetData that represents the WETH token.
     * Will throw if WETH does not exist for the current network.
     */
    private _getEtherTokenAssetDataOrThrow(): string {
        return assetDataUtils.getEtherTokenAssetData(this._contractWrappers);
    }
}
