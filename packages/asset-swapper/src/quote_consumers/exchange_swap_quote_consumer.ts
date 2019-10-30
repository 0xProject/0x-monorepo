import { ContractError, ContractWrappers, ForwarderError } from '@0x/contract-wrappers';
import { AbiEncoder, providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from '@0x/web3-wrapper';
import { MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalldataInfo,
    ExchangeSmartContractParams,
    MarketOperation,
    SmartContractParamsInfo,
    SwapQuote,
    SwapQuoteConsumerBase,
    SwapQuoteConsumerError,
    SwapQuoteConsumerOpts,
    SwapQuoteExecutionOpts,
    SwapQuoteGetOutputOpts,
} from '../types';
import { assert } from '../utils/assert';
import { swapQuoteConsumerUtils } from '../utils/swap_quote_consumer_utils';
import { utils } from '../utils/utils';

export class ExchangeSwapQuoteConsumer implements SwapQuoteConsumerBase<ExchangeSmartContractParams> {
    public readonly provider: ZeroExProvider;
    public readonly chainId: number;

    private readonly _contractWrappers: ContractWrappers;

    constructor(
        supportedProvider: SupportedProvider,
        contractWrappers: ContractWrappers,
        options: Partial<SwapQuoteConsumerOpts> = {},
    ) {
        const { chainId } = _.merge({}, constants.DEFAULT_SWAP_QUOTER_OPTS, options);
        assert.isNumber('chainId', chainId);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        this.provider = provider;
        this.chainId = chainId;
        this._contractWrappers = contractWrappers;
    }

    public async getCalldataOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetOutputOpts>,
    ): Promise<CalldataInfo> {
        assert.isValidSwapQuote('quote', quote);

        const { toAddress, methodAbi, ethAmount, params } = await this.getSmartContractParamsOrThrowAsync(quote, opts);

        const abiEncoder = new AbiEncoder.Method(methodAbi);

        const { orders, signatures } = params;
        let args: any[];
        if (params.type === MarketOperation.Buy) {
            const { makerAssetFillAmount } = params;
            args = [orders, makerAssetFillAmount, signatures];
        } else {
            const { takerAssetFillAmount } = params;
            args = [orders, takerAssetFillAmount, signatures];
        }
        const calldataHexString = abiEncoder.encode(args, { shouldOptimize: true });
        return {
            calldataHexString,
            methodAbi,
            toAddress,
            ethAmount,
        };
    }

    public async getSmartContractParamsOrThrowAsync(
        quote: SwapQuote,
        _opts: Partial<SwapQuoteGetOutputOpts> = {},
    ): Promise<SmartContractParamsInfo<ExchangeSmartContractParams>> {
        assert.isValidSwapQuote('quote', quote);

        const { orders } = quote;

        const signatures = _.map(orders, o => o.signature);

        let params: ExchangeSmartContractParams;
        let methodName: string;

        if (quote.type === MarketOperation.Buy) {
            const { makerAssetFillAmount } = quote;

            params = {
                orders,
                signatures,
                makerAssetFillAmount,
                type: MarketOperation.Buy,
            };

            methodName = 'marketBuyOrdersFillOrKill';
        } else {
            const { takerAssetFillAmount } = quote;

            params = {
                orders,
                signatures,
                takerAssetFillAmount,
                type: MarketOperation.Sell,
            };

            methodName = 'marketSellOrdersFillOrKill';
        }

        const methodAbi = utils.getMethodAbiFromContractAbi(
            this._contractWrappers.exchange.abi,
            methodName,
        ) as MethodAbi;

        return {
            params,
            toAddress: this._contractWrappers.exchange.address,
            methodAbi,
            ethAmount: quote.worstCaseQuoteInfo.protocolFeeInEthAmount,
        };
    }

    public async executeSwapQuoteOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteExecutionOpts>,
    ): Promise<string> {
        assert.isValidSwapQuote('quote', quote);

        const { takerAddress, gasLimit, gasPrice, ethAmount } = opts;

        if (takerAddress !== undefined) {
            assert.isETHAddressHex('takerAddress', takerAddress);
        }
        if (gasLimit !== undefined) {
            assert.isNumber('gasLimit', gasLimit);
        }
        if (gasPrice !== undefined) {
            assert.isBigNumber('gasPrice', gasPrice);
        }
        if (ethAmount !== undefined) {
            assert.isBigNumber('ethAmount', ethAmount);
        }
        const { orders } = quote;

        const finalTakerAddress = await swapQuoteConsumerUtils.getTakerAddressOrThrowAsync(this.provider, opts);
        const value = ethAmount || quote.worstCaseQuoteInfo.protocolFeeInEthAmount;
        try {
            let txHash: string;
            if (quote.type === MarketOperation.Buy) {
                const { makerAssetFillAmount } = quote;
                txHash = await this._contractWrappers.exchange.marketBuyOrdersFillOrKill.sendTransactionAsync(
                    orders,
                    makerAssetFillAmount,
                    orders.map(o => o.signature),
                    {
                        from: finalTakerAddress,
                        gas: gasLimit,
                        gasPrice,
                        value,
                    },
                );
            } else {
                const { takerAssetFillAmount } = quote;
                txHash = await this._contractWrappers.exchange.marketSellOrdersFillOrKill.sendTransactionAsync(
                    orders,
                    takerAssetFillAmount,
                    orders.map(o => o.signature),
                    {
                        from: finalTakerAddress,
                        gas: gasLimit,
                        gasPrice,
                        value,
                    },
                );
            }
            return txHash;
        } catch (err) {
            if (_.includes(err.message, ContractError.SignatureRequestDenied)) {
                throw new Error(SwapQuoteConsumerError.SignatureRequestDenied);
            } else if (_.includes(err.message, ForwarderError.CompleteFillFailed)) {
                throw new Error(SwapQuoteConsumerError.TransactionValueTooLow);
            } else {
                throw err;
            }
        }
    }
}
