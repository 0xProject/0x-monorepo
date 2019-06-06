import { ContractWrappers, ContractWrappersError, ForwarderWrapperError } from '@0x/contract-wrappers';
import { BigNumber, providerUtils } from '@0x/utils';
import { SupportedProvider, Web3Wrapper, ZeroExProvider } from '@0x/web3-wrapper';
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
    Web3TransactionParams} from '../types';
import { assert } from '../utils/assert';

export interface ForwarderSwapQuoteGetOutputOpts extends SwapQuoteGetOutputOpts {
    feePercentage: number;
    feeRecipient: string;
}

export const FORWARDER_SWAP_QUOTE_CONSUMER_OPTS = {
    feePercentage: 0,
    feeRecipient: constants.NULL_ADDRESS,
};

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

    public getCalldataOrThrowAsync = async (quote: SwapQuote, opts: Partial<ForwarderSwapQuoteGetOutputOpts>): Promise<CalldataInformation> => {

    }

    public getWeb3TransactionParamsOrThrowAsync = async (quote: SwapQuote, opts: Partial<ForwarderSwapQuoteGetOutputOpts>): Promise<Web3TransactionParams> => {

    }

    public getSmartContractParamsOrThrowAsync = async (quote: SwapQuote, opts: Partial<ForwarderSwapQuoteGetOutputOpts>): Promise<SmartContractParams> => {
        const { feeRecipient, feePercentage } = _.merge(
            {},
            FORWARDER_SWAP_QUOTE_CONSUMER_OPTS,
            opts,
        );

        assert.isValidSwapQuote('quote', quote);
        assert.isNumber('feePercentage', feePercentage);
        assert.isETHAddressHex('feeRecipient', feeRecipient);

        const swapQuoteWithFeeAdded = addAffiliateFeeToSwapQuote(quote, feePercentage);

        const { orders, feeOrders, makerAssetBuyAmount, worstCaseQuoteInfo } = swapQuoteWithFeeAdded;

        const params = {
            orders: [],
            makerAssetFillAmount: makerAssetBuyAmount,
            signatures: [],
            feeOrders: [],
            feeSignatures: [],
            feePercentage: [],
            feeRecipient: [],
        };
    }

    public executeSwapQuoteOrThrowAsync = async (quote: SwapQuote, opts: Partial<SwapQuoteExecutionOpts>): Promise<string> => {
        const { ethAmount, takerAddress, feeRecipient, gasLimit, gasPrice, feePercentage } = _.merge(
            {},
            FORWARDER_SWAP_QUOTE_CONSUMER_OPTS,
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

        let finalTakerAddress;
        if (takerAddress !== undefined) {
            finalTakerAddress = takerAddress;
        } else {
            const web3Wrapper = new Web3Wrapper(this.provider);
            const availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
            const firstAvailableAddress = _.head(availableAddresses);
            if (firstAvailableAddress !== undefined) {
                finalTakerAddress = firstAvailableAddress;
            } else {
                throw new Error(AssetSwapQuoterError.NoAddressAvailable);
            }
        }
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

}
