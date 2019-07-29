import { ContractWrappers, ContractWrappersError, ForwarderWrapperError } from '@0x/contract-wrappers';
import { assetDataUtils } from '@0x/order-utils';
import { ERC20AssetData, MarketOperation } from '@0x/types';
import { AbiEncoder, providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from '@0x/web3-wrapper';
import { MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalldataInfo,
    DydxExchangeWrappersParams,
    ExchangeSmartContractParams,
    ExchangeWrappersParams,
    ExchangeWrappersParamsInfo,
    ExchangeWrapperType,
    SmartContractParamsInfo,
    SwapQuote,
    SwapQuoteConsumerBase,
    SwapQuoteConsumerError,
    SwapQuoteConsumerOpts,
    SwapQuoteExecutionOptsBase,
    SwapQuoteGetExchangeWrappersParamsOpts,
    SwapQuoteGetOutputOptsBase,
} from '../types';
import { assert } from '../utils/assert';
import { ExchangeWrappersUtils } from '../utils/exchange_wrappers_utils';
import { swapQuoteConsumerUtils } from '../utils/swap_quote_consumer_utils';
import { utils } from '../utils/utils';

export class ExchangeSwapQuoteConsumer
    implements SwapQuoteConsumerBase<ExchangeSmartContractParams, ExchangeWrappersParams> {
    public readonly provider: ZeroExProvider;
    public readonly networkId: number;

    private readonly _contractWrappers: ContractWrappers;
    private readonly _exchangeWrappersUtils: ExchangeWrappersUtils;

    constructor(supportedProvider: SupportedProvider, options: Partial<SwapQuoteConsumerOpts> = {}) {
        const { networkId } = _.merge({}, constants.DEFAULT_SWAP_QUOTER_OPTS, options);
        assert.isNumber('networkId', networkId);

        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        this.provider = provider;
        this.networkId = networkId;
        this._exchangeWrappersUtils = new ExchangeWrappersUtils(provider, options);
        this._contractWrappers = new ContractWrappers(this.provider, {
            networkId,
        });
    }

    public async getExchangeWrappersParamsOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetExchangeWrappersParamsOpts>,
    ): Promise<ExchangeWrappersParamsInfo<ExchangeWrappersParams>> {
        if (quote.type === MarketOperation.Sell && opts.useExchangeWrapperType === ExchangeWrapperType.Dydx) {
            const smartContractParams = await this.getSmartContractParamsOrThrowAsync(quote, opts);

            const decodedMakerAssetData = (assetDataUtils.decodeAssetDataOrThrow(
                quote.makerAssetData,
            ) as any) as ERC20AssetData;
            const decodedTakerAssetData = (assetDataUtils.decodeAssetDataOrThrow(
                quote.takerAssetData,
            ) as any) as ERC20AssetData;

            const { orderData, to } = this._exchangeWrappersUtils.generateDydxExchangeWrapperOrderData(quote.orders);

            const params: DydxExchangeWrappersParams = {
                tradeOriginator: constants.NULL_ADDRESS, // tradeOriginator is the CFL smart contract that is calling the exchange wrapper
                receiver: opts.takerAddress || constants.NULL_ADDRESS,
                makerToken: decodedMakerAssetData.tokenAddress,
                takerToken: decodedTakerAssetData.tokenAddress,
                requestedFillAmount: quote.takerAssetFillAmount,
                orderData,
            };

            return {
                params,
                methodAbi: constants.DYDX_EXCHANGE_WRAPPERS_METHOD_ABI,
                to,
                ethAmount: smartContractParams.ethAmount,
            };
        } else {
            throw new Error(SwapQuoteConsumerError.DoNotSupportConsumerOutput);
        }
    }

    public async getCalldataOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetOutputOptsBase>,
    ): Promise<CalldataInfo> {
        assert.isValidSwapQuote('quote', quote);

        const { to, methodAbi, ethAmount, params } = await this.getSmartContractParamsOrThrowAsync(quote, opts);

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
        _opts: Partial<SwapQuoteGetOutputOptsBase>,
    ): Promise<SmartContractParamsInfo<ExchangeSmartContractParams>> {
        assert.isValidSwapQuote('quote', quote);

        const { orders } = quote;

        const signatures = _.map(orders, o => o.signature);

        const optimizedOrders = swapQuoteConsumerUtils.optimizeOrdersForMarketExchangeOperation(orders, quote.type);

        let params: ExchangeSmartContractParams;
        let methodName: string;

        if (quote.type === MarketOperation.Buy) {
            const { makerAssetFillAmount } = quote;

            params = {
                orders: optimizedOrders,
                signatures,
                makerAssetFillAmount,
                type: MarketOperation.Buy,
            };

            methodName = 'marketBuyOrders';
        } else {
            const { takerAssetFillAmount } = quote;

            params = {
                orders: optimizedOrders,
                signatures,
                takerAssetFillAmount,
                type: MarketOperation.Sell,
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
        opts: Partial<SwapQuoteExecutionOptsBase>,
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

        const { orders } = quote;

        const finalTakerAddress = await swapQuoteConsumerUtils.getTakerAddressOrThrowAsync(this.provider, opts);

        try {
            let txHash: string;
            if (quote.type === MarketOperation.Buy) {
                const { makerAssetFillAmount } = quote;
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
                const { takerAssetFillAmount } = quote;
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
