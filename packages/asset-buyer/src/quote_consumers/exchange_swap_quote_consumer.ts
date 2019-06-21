import { ContractWrappers, ContractWrappersError, ForwarderWrapperError, SignedOrder } from '@0x/contract-wrappers';
import { AbiEncoder, abiUtils, BigNumber, providerUtils } from '@0x/utils';
import { SupportedProvider, Web3Wrapper, ZeroExProvider } from '@0x/web3-wrapper';
import { MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalldataInfo,
    ExchangeMarketBuySmartContractParams,
    SmartContractParamsInfo,
    SwapQuote,
    SwapQuoteConsumer,
    SwapQuoteConsumerError,
    SwapQuoteConsumerOpts,
    SwapQuoteExecutionOpts,
    SwapQuoteGetOutputOpts,
} from '../types';
import { assert } from '../utils/assert';
import { SwapQuoteConsumerUtils } from '../utils/swap_quote_consumer_utils';
import { utils } from '../utils/utils';

export class ExchangeSwapQuoteConsumer implements SwapQuoteConsumer<ExchangeMarketBuySmartContractParams> {

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

    public getCalldataOrThrow = (quote: SwapQuote, opts: Partial<SwapQuoteGetOutputOpts>): CalldataInfo => {
        assert.isValidSwapQuote('quote', quote);

        const { params, to, ethAmount, methodAbi } = this.getSmartContractParamsOrThrow(quote, opts);
        const abiEncoder = new AbiEncoder.Method(methodAbi);
        const args = [
            params.orders,
            params.makerAssetFillAmount,
            params.signatures,
        ];
        const calldataHexString = abiEncoder.encode(args);
        return {
            calldataHexString,
            methodAbi,
            to,
            ethAmount,
        };
    }

    public getSmartContractParamsOrThrow = (quote: SwapQuote, opts: Partial<SwapQuoteGetOutputOpts>): SmartContractParamsInfo<ExchangeMarketBuySmartContractParams> => {
        assert.isValidSwapQuote('quote', quote);

        const { orders, makerAssetFillAmount } = quote;

        const signatures = _.map(orders, o => o.signature);

        const params: ExchangeMarketBuySmartContractParams = {
           orders,
           signatures,
           makerAssetFillAmount,
        };

        const methodAbi = utils.getMethodAbiFromContractAbi(
            this._contractWrappers.exchange.abi,
            'marketBuyOrdersNoThrow',
        ) as MethodAbi;

        return {
            params,
            to: this._contractWrappers.exchange.address,
            methodAbi,
        };
    }

    public executeSwapQuoteOrThrowAsync = async (quote: SwapQuote, opts: Partial<SwapQuoteExecutionOpts>): Promise<string> => {
        assert.isValidSwapQuote('quote', quote);

        const { takerAddress, gasLimit, gasPrice } = opts;

        if (takerAddress !== undefined) {
            assert.isETHAddressHex('takerAddress', takerAddress);
        }
        if (gasLimit !== undefined) {
            assert.isNumber('gasLimit', gasLimit);
        }
        if (gasPrice !== undefined) {
            assert.isBigNumber('gasPrice', gasPrice);
        }

        const { orders, makerAssetFillAmount } = quote;

        const finalTakerAddress = await SwapQuoteConsumerUtils.getTakerAddressOrThrowAsync(this.provider, opts);

        try {
            const txHash = await this._contractWrappers.exchange.marketBuyOrdersNoThrowAsync(
                orders,
                makerAssetFillAmount,
                finalTakerAddress,
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
}
