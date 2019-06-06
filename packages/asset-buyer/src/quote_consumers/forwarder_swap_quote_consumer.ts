import { ContractWrappers, ContractWrappersError, ForwarderWrapperError, SignedOrder } from '@0x/contract-wrappers';
import { AbiEncoder, abiUtils, BigNumber, providerUtils } from '@0x/utils';
import { SupportedProvider, Web3Wrapper, ZeroExProvider } from '@0x/web3-wrapper';
import { MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    AssetSwapQuoterError,
    CalldataInformation,
    SmartContractParams,
    SwapQuote,
    SwapQuoteConsumer,
    SwapQuoteConsumerOpts,
    SwapQuoteExecutionOpts,
    SwapQuoteGetOutputOpts,
    SwapQuoteInfo,
} from '../types';
import { assert } from '../utils/assert';
import { utils } from '../utils/utils';

import { assetDataUtils } from '../utils/asset_data_utils';

export interface ForwarderSwapQuoteGetOutputOpts extends SwapQuoteGetOutputOpts {
    feePercentage: number;
    feeRecipient: string;
    ethAmount?: BigNumber;
}

export interface ForwarderSwapQuoteExecutionOpts extends SwapQuoteExecutionOpts, ForwarderSwapQuoteGetOutputOpts {
}

const addAffiliateFeeToSwapQuoteInfo = (quoteInfo: SwapQuoteInfo, feePercentage: number): SwapQuoteInfo => {
    const newQuoteInfo = _.clone(quoteInfo);
    const affiliateFeeAmount = newQuoteInfo.takerTokenAmount.multipliedBy(feePercentage).integerValue(BigNumber.ROUND_CEIL);
    const newFeeAmount = newQuoteInfo.feeTakerTokenAmount.plus(affiliateFeeAmount);
    newQuoteInfo.feeTakerTokenAmount = newFeeAmount;
    newQuoteInfo.totalTakerTokenAmount = newFeeAmount.plus(newQuoteInfo.takerTokenAmount);
    return newQuoteInfo;
};

const addAffiliateFeeToSwapQuote = (quote: SwapQuote, feePercentage: number): SwapQuote => {
    const newQuote = _.clone(quote);
    newQuote.bestCaseQuoteInfo = addAffiliateFeeToSwapQuoteInfo(newQuote.bestCaseQuoteInfo, feePercentage);
    newQuote.worstCaseQuoteInfo = addAffiliateFeeToSwapQuoteInfo(newQuote.worstCaseQuoteInfo, feePercentage);
    return newQuote;
};

export class ForwarderSwapQuoteConsumer implements SwapQuoteConsumer {

    public readonly provider: ZeroExProvider;
    public readonly networkId: number;

    private readonly _contractWrappers: ContractWrappers;

    constructor(
        supportedProvider: SupportedProvider,
        options: Partial<SwapQuoteConsumerOpts> = {},
    ) {
        const { networkId } = _.merge(
            {},
            constants.DEFAULT_ASSET_SWAP_QUOTER_OPTS,
            options,
        );
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isNumber('networkId', networkId);
        this.provider = provider;
        this.networkId = networkId;
        this._contractWrappers = new ContractWrappers(this.provider, {
            networkId,
        });
    }

    public getCalldataOrThrow = (quote: SwapQuote, opts: Partial<ForwarderSwapQuoteGetOutputOpts>): CalldataInformation => {
        if (!this.isValidForwarderSwapQuote(quote)) {
            throw new Error(AssetSwapQuoterError.InvalidForwarderSwapQuote);
        }
        const { params, to, value } = this.getSmartContractParamsOrThrow(quote, opts);
        const methodAbi = utils.getMethodAbiFromContractAbi(this._contractWrappers.forwarder.abi, 'marketBuyOrdersWithEth') as MethodAbi;
        const abiEncoder = new AbiEncoder.Method(methodAbi);
        const args = [params.orders, params.makerAssetFillAmount, params.signatures, params.feeOrders, params.feeSignatures, params.feePercentage, params.feeRecipient];
        const calldataHexString = abiEncoder.encode(args);
        return {
            calldataHexString,
            to,
            value,
        };
    }

    public getSmartContractParamsOrThrow = (quote: SwapQuote, opts: Partial<ForwarderSwapQuoteGetOutputOpts>): SmartContractParams => {
        if (!this.isValidForwarderSwapQuote(quote)) {
            throw new Error(AssetSwapQuoterError.InvalidForwarderSwapQuote);
        }
        const { ethAmount, feeRecipient, feePercentage: unFormattedFeePercentage } = _.merge(
            {},
            constants.DEFAULT_FORWARDER_SWAP_QUOTE_CONSUMER_FEE_OPTS,
            opts,
        );

        assert.isValidSwapQuote('quote', quote);
        assert.isNumber('feePercentage', unFormattedFeePercentage);
        assert.isETHAddressHex('feeRecipient', feeRecipient);

        if (!!ethAmount) {
            assert.isBigNumber('ethAmount', ethAmount);
        }

        const swapQuoteWithFeeAdded = addAffiliateFeeToSwapQuote(quote, unFormattedFeePercentage);

        const { orders, feeOrders, makerAssetBuyAmount: makerAssetFillAmount, worstCaseQuoteInfo } = swapQuoteWithFeeAdded;

        const signatures = _.map(orders, o => o.signature);
        const feeSignatures = _.map(orders, o => o.signature);

        const feePercentage = utils.numberPercentageToEtherTokenAmountPercentage(unFormattedFeePercentage);


        const params = {
            orders,
            makerAssetFillAmount,
            signatures,
            feeOrders,
            feeSignatures,
            feePercentage,
            feeRecipient,
        };

        return {
            params,
            to: this._contractWrappers.forwarder.address,
            value: ethAmount || quote.worstCaseQuoteInfo.totalTakerTokenAmount,
        };
    }

    public executeSwapQuoteOrThrowAsync = async (quote: SwapQuote, opts: Partial<ForwarderSwapQuoteExecutionOpts>): Promise<string> => {
        if (!this.isValidForwarderSwapQuote(quote)) {
            throw new Error(AssetSwapQuoterError.InvalidForwarderSwapQuote);
        }
        const { ethAmount, takerAddress, feeRecipient, gasLimit, gasPrice, feePercentage } = _.merge(
            {},
            constants.DEFAULT_FORWARDER_SWAP_QUOTE_CONSUMER_FEE_OPTS,
            opts,
        );

        assert.isValidSwapQuote('quote', quote);

        if (ethAmount !== undefined) {
            assert.isBigNumber('ethAmount', ethAmount);
        }
        if (takerAddress !== undefined) {
            assert.isETHAddressHex('takerAddress', takerAddress);
        }
        assert.isETHAddressHex('feeRecipient', feeRecipient);
        if (gasLimit !== undefined) {
            assert.isNumber('gasLimit', gasLimit);
        }
        if (gasPrice !== undefined) {
            assert.isBigNumber('gasPrice', gasPrice);
        }

        const swapQuoteWithFeeAdded = addAffiliateFeeToSwapQuote(quote, feePercentage);

        const { orders, feeOrders, makerAssetBuyAmount, worstCaseQuoteInfo } = swapQuoteWithFeeAdded;

        const finalTakerAddress = await this._getTakerAddressOrThrowAsync(opts);
        try {
            const txHash = await this._contractWrappers.forwarder.marketBuyOrdersWithEthAsync(
                orders,
                makerAssetBuyAmount,
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
                throw new Error(AssetSwapQuoterError.SignatureRequestDenied);
            } else if (_.includes(err.message, ForwarderWrapperError.CompleteFillFailed)) {
                throw new Error(AssetSwapQuoterError.TransactionValueTooLow);
            } else {
                throw err;
            }
        }
    }

    public isValidForwarderSwapQuote = (quote: SwapQuote): boolean => {
        const isValidMarketOrders = this._isValidForwarderSignedOrders(quote.orders);
        const isValidFeeOrders = this._isValidForwarderSignedOrders(quote.feeOrders);
        return isValidMarketOrders && isValidFeeOrders;
    }

    private readonly _getTakerAddressOrThrowAsync = async (opts: Partial<ForwarderSwapQuoteExecutionOpts>): Promise<string> => {
        if (opts.takerAddress !== undefined) {
            return opts.takerAddress;
        } else {
            const web3Wrapper = new Web3Wrapper(this.provider);
            const availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
            const firstAvailableAddress = _.head(availableAddresses);
            if (firstAvailableAddress !== undefined) {
                return firstAvailableAddress;
            } else {
                throw new Error(AssetSwapQuoterError.NoAddressAvailable);
            }
        }
    }

    private _getEtherTokenAssetDataOrThrow(): string {
        return assetDataUtils.getEtherTokenAssetData(this._contractWrappers);
    }

    private readonly _isValidForwarderSignedOrders = (orders: SignedOrder[]): boolean => {
        const wethAssetData = this._getEtherTokenAssetDataOrThrow();
        return _.reduce(orders, (a: boolean, c: SignedOrder): boolean => {
            if (c.takerAssetData === wethAssetData) {
                return a;
            } else {
                return false;
            }
        }, true);
    }
}
