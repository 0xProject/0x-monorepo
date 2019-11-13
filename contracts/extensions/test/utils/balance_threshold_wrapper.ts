import { ExchangeContract } from '@0x/contracts-exchange';
import {
    FillResults,
    formatters,
    LogDecoder,
    OrderInfo,
    orderUtils,
    TransactionFactory,
    Web3ProviderEngine,
} from '@0x/contracts-test-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { artifacts, BalanceThresholdFilterContract } from '../../src';

export class BalanceThresholdWrapper {
    private readonly _balanceThresholdFilter: BalanceThresholdFilterContract;
    private readonly _signerTransactionFactory: TransactionFactory;
    private readonly _exchange: ExchangeContract;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _logDecoder: LogDecoder;
    constructor(
        balanceThresholdFilter: BalanceThresholdFilterContract,
        exchangeContract: ExchangeContract,
        signerTransactionFactory: TransactionFactory,
        provider: Web3ProviderEngine,
    ) {
        this._balanceThresholdFilter = balanceThresholdFilter;
        this._exchange = exchangeContract;
        this._signerTransactionFactory = signerTransactionFactory;
        this._web3Wrapper = new Web3Wrapper(provider);
        this._logDecoder = new LogDecoder(this._web3Wrapper, artifacts);
    }
    public async fillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const data = this._exchange
            .fillOrder(params.order, params.takerAssetFillAmount, params.signature)
            .getABIEncodedTransactionData();
        const txReceipt = this._executeTransactionAsync(data, from);
        return txReceipt;
    }
    public async fillOrKillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const data = this._exchange
            .fillOrKillOrder(params.order, params.takerAssetFillAmount, params.signature)
            .getABIEncodedTransactionData();
        const txReceipt = this._executeTransactionAsync(data, from);
        return txReceipt;
    }
    public async fillOrderNoThrowAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber; gas?: number } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const data = this._exchange
            .fillOrderNoThrow(params.order, params.takerAssetFillAmount, params.signature)
            .getABIEncodedTransactionData();
        const txReceipt = this._executeTransactionAsync(data, from, opts.gas);
        return txReceipt;
    }
    public async batchFillOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerAssetFillAmounts);
        const data = this._exchange
            .batchFillOrders(params.orders, params.takerAssetFillAmounts, params.signatures)
            .getABIEncodedTransactionData();
        const txReceipt = this._executeTransactionAsync(data, from);
        return txReceipt;
    }
    public async batchFillOrKillOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerAssetFillAmounts);
        const data = this._exchange
            .batchFillOrKillOrders(params.orders, params.takerAssetFillAmounts, params.signatures)
            .getABIEncodedTransactionData();
        const txReceipt = this._executeTransactionAsync(data, from);
        return txReceipt;
    }
    public async batchFillOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[]; gas?: number } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerAssetFillAmounts);
        const data = this._exchange
            .batchFillOrKillOrders(params.orders, params.takerAssetFillAmounts, params.signatures)
            .getABIEncodedTransactionData();
        const txReceipt = this._executeTransactionAsync(data, from, opts.gas);
        return txReceipt;
    }
    public async marketSellOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmount: BigNumber },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketSellOrders(orders, opts.takerAssetFillAmount);
        const data = this._exchange
            .marketSellOrders(params.orders, params.takerAssetFillAmount, params.signatures)
            .getABIEncodedTransactionData();
        const txReceipt = this._executeTransactionAsync(data, from);
        return txReceipt;
    }
    public async marketSellOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmount: BigNumber; gas?: number },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketSellOrders(orders, opts.takerAssetFillAmount);
        const data = this._exchange
            .marketSellOrdersNoThrow(params.orders, params.takerAssetFillAmount, params.signatures)
            .getABIEncodedTransactionData();
        const txReceipt = this._executeTransactionAsync(data, from, opts.gas);
        return txReceipt;
    }
    public async marketBuyOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { makerAssetFillAmount: BigNumber },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketBuyOrders(orders, opts.makerAssetFillAmount);
        const data = this._exchange
            .marketBuyOrders(params.orders, params.makerAssetFillAmount, params.signatures)
            .getABIEncodedTransactionData();
        const txReceipt = this._executeTransactionAsync(data, from);
        return txReceipt;
    }
    public async marketBuyOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { makerAssetFillAmount: BigNumber; gas?: number },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketBuyOrders(orders, opts.makerAssetFillAmount);
        const data = this._exchange
            .marketBuyOrdersNoThrow(params.orders, params.makerAssetFillAmount, params.signatures)
            .getABIEncodedTransactionData();
        const txReceipt = this._executeTransactionAsync(data, from, opts.gas);
        return txReceipt;
    }
    public async cancelOrderAsync(signedOrder: SignedOrder, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createCancel(signedOrder);
        const data = this._exchange.cancelOrder(params.order).getABIEncodedTransactionData();
        const txReceipt = this._executeTransactionAsync(data, from);
        return txReceipt;
    }
    public async batchCancelOrdersAsync(
        orders: SignedOrder[],
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchCancel(orders);
        const data = this._exchange.batchCancelOrders(params.orders).getABIEncodedTransactionData();
        const txReceipt = this._executeTransactionAsync(data, from);
        return txReceipt;
    }
    public async cancelOrdersUpToAsync(salt: BigNumber, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const data = this._exchange.cancelOrdersUpTo(salt).getABIEncodedTransactionData();
        const txReceipt = this._executeTransactionAsync(data, from);
        return txReceipt;
    }
    public async getTakerAssetFilledAmountAsync(orderHashHex: string): Promise<BigNumber> {
        const filledAmount = await this._exchange.filled(orderHashHex).callAsync();
        return filledAmount;
    }
    public async isCancelledAsync(orderHashHex: string): Promise<boolean> {
        const isCancelled = await this._exchange.cancelled(orderHashHex).callAsync();
        return isCancelled;
    }
    public async getOrderEpochAsync(makerAddress: string, senderAddress: string): Promise<BigNumber> {
        const orderEpoch = await this._exchange.orderEpoch(makerAddress, senderAddress).callAsync();
        return orderEpoch;
    }
    public async getOrderInfoAsync(signedOrder: SignedOrder): Promise<OrderInfo> {
        const orderInfo = await this._exchange.getOrderInfo(signedOrder).callAsync();
        return orderInfo;
    }
    public async getOrdersInfoAsync(signedOrders: SignedOrder[]): Promise<OrderInfo[]> {
        const ordersInfo = (await this._exchange.getOrdersInfo(signedOrders)).callAsync() as OrderInfo[];
        return ordersInfo;
    }
    public async matchOrdersAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createMatchOrders(signedOrderLeft, signedOrderRight);
        const data = this._exchange
            .matchOrders(params.left, params.right, params.leftSignature, params.rightSignature)
            .getABIEncodedTransactionData();
        const txReceipt = this._executeTransactionAsync(data, from);
        return txReceipt;
    }
    public async getFillOrderResultsAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber } = {},
    ): Promise<FillResults> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const fillResults = await this._exchange
            .fillOrder(params.order, params.takerAssetFillAmount, params.signature)
            .callAsync({ from });
        return fillResults;
    }
    public abiEncodeFillOrder(signedOrder: SignedOrder, opts: { takerAssetFillAmount?: BigNumber } = {}): string {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const data = this._exchange
            .fillOrder(params.order, params.takerAssetFillAmount, params.signature)
            .getABIEncodedTransactionData();
        return data;
    }
    public getBalanceThresholdAddress(): string {
        return this._balanceThresholdFilter.address;
    }
    public getExchangeAddress(): string {
        return this._exchange.address;
    }
    private async _executeTransactionAsync(
        abiEncodedExchangeTxData: string,
        from: string,
        gas?: number,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const signedExchangeTx = this._signerTransactionFactory.newSignedTransaction(abiEncodedExchangeTxData);
        const txOpts = gas === undefined ? { from } : { from, gas };
        const txHash = await this._balanceThresholdFilter
            .executeTransaction(
                signedExchangeTx.salt,
                signedExchangeTx.signerAddress,
                signedExchangeTx.data,
                signedExchangeTx.signature,
                txOpts,
            )
            .sendTransactionAsync();
        const txReceipt = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return txReceipt;
    }
}
