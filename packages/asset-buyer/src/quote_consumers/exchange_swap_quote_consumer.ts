import { ContractWrappers, ContractWrappersError, ForwarderWrapperError } from '@0x/contract-wrappers';
import { AbiEncoder, providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from '@0x/web3-wrapper';
import { MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalldataInfo,
    ExchangeMarketBuySmartContractParams,
    ExchangeMarketSellSmartContractParams,
    MarketBuySwapQuote,
    MarketSellSwapQuote,
    SmartContractParamsInfo,
    SwapQuote,
    SwapQuoteConsumer,
    SwapQuoteConsumerError,
    SwapQuoteConsumerOpts,
    SwapQuoteExecutionOpts,
    SwapQuoteGetOutputOpts,
} from '../types';
import { assert } from '../utils/assert';
import { swapQuoteConsumerUtils } from '../utils/swap_quote_consumer_utils';
import { utils } from '../utils/utils';

export class ExchangeSwapQuoteConsumer implements SwapQuoteConsumer<ExchangeMarketBuySmartContractParams | ExchangeMarketSellSmartContractParams> {
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

    public async getCalldataOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetOutputOpts>,
    ): Promise<CalldataInfo> {
        assert.isValidSwapQuote('quote', quote);

        const consumableQuote = (quote as any) as (MarketBuySwapQuote | MarketSellSwapQuote);
        const smartContractParamsInfo = await this.getSmartContractParamsOrThrowAsync(consumableQuote, opts);
        const { to, methodAbi, ethAmount } = smartContractParamsInfo;

        const abiEncoder = new AbiEncoder.Method(methodAbi);

        let args: any[];
        if (utils.isSwapQuoteMarketBuy(consumableQuote)) {
            const marketBuyParams = (smartContractParamsInfo.params as any) as ExchangeMarketBuySmartContractParams;
            args = [marketBuyParams.orders, marketBuyParams.makerAssetFillAmount, marketBuyParams.signatures];
        } else {
            const marketSellParams = (smartContractParamsInfo.params as any) as ExchangeMarketSellSmartContractParams;
            args = [marketSellParams.orders, marketSellParams.takerAssetFillAmount, marketSellParams.signatures];
        }
        const calldataHexString = abiEncoder.encode(args);
        return {
            calldataHexString,
            methodAbi,
            to,
            ethAmount,
        };
    }

    public async getSmartContractParamsOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetOutputOpts>,
    ): Promise<SmartContractParamsInfo<ExchangeMarketBuySmartContractParams | ExchangeMarketSellSmartContractParams>> {
        assert.isValidSwapQuote('quote', quote);

        const consumableQuote = (quote as any) as (
            | MarketBuySwapQuote
            | MarketSellSwapQuote);

        const { orders } = consumableQuote;

        const signatures = _.map(orders, o => o.signature);

        let params: ExchangeMarketBuySmartContractParams | ExchangeMarketSellSmartContractParams;
        let methodName: string;

        if (utils.isSwapQuoteMarketBuy(consumableQuote)) {
            const { makerAssetFillAmount } = consumableQuote;

            params = {
                orders,
                signatures,
                makerAssetFillAmount,
            };

            methodName = 'marketBuyOrders';
        } else {
            const { takerAssetFillAmount } = consumableQuote;

            params = {
                orders,
                signatures,
                takerAssetFillAmount,
            };

            methodName = 'marketSellOrders';
        }

        const methodAbi = utils.getMethodAbiFromContractAbi(
            this._contractWrappers.exchange.abi,
            methodName,
        ) as MethodAbi;

        return {
            params,
            to: this._contractWrappers.exchange.address,
            methodAbi,
        };
    }

    public async executeSwapQuoteOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteExecutionOpts>,
    ): Promise<string> {
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

        const consumableQuote = (quote as any) as (
            | MarketBuySwapQuote
            | MarketSellSwapQuote);

        const { orders } = consumableQuote;

        const finalTakerAddress = await swapQuoteConsumerUtils.getTakerAddressOrThrowAsync(this.provider, opts);

        try {
            let txHash: string;
            if (utils.isSwapQuoteMarketBuy(consumableQuote)) {
                const { makerAssetFillAmount } = consumableQuote;
                txHash = await this._contractWrappers.exchange.marketBuyOrdersNoThrowAsync(
                    orders,
                    makerAssetFillAmount,
                    finalTakerAddress,
                    {
                        gasLimit,
                        gasPrice,
                        shouldValidate: true,
                    },
                );
            } else {
                const { takerAssetFillAmount } = consumableQuote;
                txHash = await this._contractWrappers.exchange.marketSellOrdersNoThrowAsync(
                    orders,
                    takerAssetFillAmount,
                    finalTakerAddress,
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
}
