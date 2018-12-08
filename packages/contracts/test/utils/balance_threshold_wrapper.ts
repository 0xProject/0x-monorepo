import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Provider, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { ExchangeContract } from '../../generated-wrappers/exchange';
import { BalanceThresholdFilterContract } from '../../generated-wrappers/balance_threshold_filter';

import { formatters } from './formatters';
import { LogDecoder } from './log_decoder';
import { orderUtils } from './order_utils';
import { TransactionFactory } from '../utils/transaction_factory';
import { OrderInfo } from './types';

export class BalanceThresholdWrapper {
    private readonly _balanceThresholdFilter: BalanceThresholdFilterContract;
    private readonly _signerTransactionFactory: TransactionFactory;
    private readonly _exchange: ExchangeContract;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _logDecoder: LogDecoder;
    constructor(balanceThresholdFilter: BalanceThresholdFilterContract, exchangeContract: ExchangeContract, signerTransactionFactory: TransactionFactory, provider: Provider) {
        this._balanceThresholdFilter = balanceThresholdFilter;
        this._exchange = exchangeContract;
        this._signerTransactionFactory = signerTransactionFactory;
        this._web3Wrapper = new Web3Wrapper(provider);
        this._logDecoder = new LogDecoder(this._web3Wrapper);
    }
    public async fillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const data = this._exchange.fillOrder.getABIEncodedTransactionData(
            params.order,
            params.takerAssetFillAmount,
            params.signature,
        );
        const txReceipt = this._executeTransaction(data, from);
        return txReceipt;
    }
    public async fillOrKillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const data = this._exchange.fillOrKillOrder.getABIEncodedTransactionData(
            params.order,
            params.takerAssetFillAmount,
            params.signature,
        );
        const txReceipt = this._executeTransaction(data, from);
        return txReceipt;
    }
    public async fillOrderNoThrowAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber; gas?: number } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const data = this._exchange.fillOrderNoThrow.getABIEncodedTransactionData(
            params.order,
            params.takerAssetFillAmount,
            params.signature,
        );
        const txReceipt = this._executeTransaction(data, from, opts.gas);
        return txReceipt;
    }
    public async batchFillOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerAssetFillAmounts);
        const data = this._exchange.batchFillOrders.getABIEncodedTransactionData(
            params.orders,
            params.takerAssetFillAmounts,
            params.signatures,
        );
        const txReceipt = this._executeTransaction(data, from);
        return txReceipt;
    }
    public async batchFillOrKillOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerAssetFillAmounts);
        const data = this._exchange.batchFillOrKillOrders.getABIEncodedTransactionData(
            params.orders,
            params.takerAssetFillAmounts,
            params.signatures,
        );
        const txReceipt = this._executeTransaction(data, from);
        return txReceipt;
    }
    public async batchFillOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[]; gas?: number } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerAssetFillAmounts);
        const data = this._exchange.batchFillOrKillOrders.getABIEncodedTransactionData(
            params.orders,
            params.takerAssetFillAmounts,
            params.signatures,
        );
        const txReceipt = this._executeTransaction(data, from, opts.gas);
        return txReceipt;
    }
    public async marketSellOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmount: BigNumber },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketSellOrders(orders, opts.takerAssetFillAmount);
        const data = this._exchange.marketSellOrders.getABIEncodedTransactionData(
            params.orders,
            params.takerAssetFillAmount,
            params.signatures,
        );
        const txReceipt = this._executeTransaction(data, from);
        return txReceipt;
    }
    public async marketSellOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmount: BigNumber; gas?: number },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketSellOrders(orders, opts.takerAssetFillAmount);
        const data = this._exchange.marketSellOrdersNoThrow.getABIEncodedTransactionData(
            params.orders,
            params.takerAssetFillAmount,
            params.signatures,
        );
        const txReceipt = this._executeTransaction(data, from, opts.gas);
        return txReceipt;
    }
    public async marketBuyOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { makerAssetFillAmount: BigNumber },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketBuyOrders(orders, opts.makerAssetFillAmount);
        const data = this._exchange.marketBuyOrders.getABIEncodedTransactionData(
            params.orders,
            params.makerAssetFillAmount,
            params.signatures,
        );
        const txReceipt = this._executeTransaction(data, from);
        return txReceipt;
    }
    public async marketBuyOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { makerAssetFillAmount: BigNumber; gas?: number },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketBuyOrders(orders, opts.makerAssetFillAmount);
        const data = this._exchange.marketBuyOrdersNoThrow.getABIEncodedTransactionData(
            params.orders,
            params.makerAssetFillAmount,
            params.signatures,
        );
        const txReceipt = this._executeTransaction(data, from, opts.gas);
        return txReceipt;
    }
    public async cancelOrderAsync(signedOrder: SignedOrder, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createCancel(signedOrder);
        const data = this._exchange.cancelOrder.getABIEncodedTransactionData(params.order);
        const txReceipt = this._executeTransaction(data, from);
        return txReceipt;
    }
    public async batchCancelOrdersAsync(
        orders: SignedOrder[],
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchCancel(orders);
        const data = this._exchange.batchCancelOrders.getABIEncodedTransactionData(params.orders);
        const txReceipt = this._executeTransaction(data, from);
        return txReceipt;
    }
    public async cancelOrdersUpToAsync(salt: BigNumber, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const data = this._exchange.cancelOrdersUpTo.getABIEncodedTransactionData(salt);
        const txReceipt = this._executeTransaction(data, from);
        return txReceipt;
    }
    public async getTakerAssetFilledAmountAsync(orderHashHex: string): Promise<BigNumber> {
        const filledAmount = await this._exchange.filled.callAsync(orderHashHex);
        return filledAmount;
    }
    public async isCancelledAsync(orderHashHex: string): Promise<boolean> {
        const isCancelled = await this._exchange.cancelled.callAsync(orderHashHex);
        return isCancelled;
    }
    public async getOrderEpochAsync(makerAddress: string, senderAddress: string): Promise<BigNumber> {
        const orderEpoch = await this._exchange.orderEpoch.callAsync(makerAddress, senderAddress);
        return orderEpoch;
    }
    public async getOrderInfoAsync(signedOrder: SignedOrder): Promise<OrderInfo> {
        const orderInfo = (await this._exchange.getOrderInfo.callAsync(signedOrder)) as OrderInfo;
        return orderInfo;
    }
    public async getOrdersInfoAsync(signedOrders: SignedOrder[]): Promise<OrderInfo[]> {
        const ordersInfo = (await this._exchange.getOrdersInfo.callAsync(signedOrders)) as OrderInfo[];
        return ordersInfo;
    }
    public async matchOrdersAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createMatchOrders(signedOrderLeft, signedOrderRight);
        const data = await this._exchange.matchOrders.getABIEncodedTransactionData(
            params.left,
            params.right,
            params.leftSignature,
            params.rightSignature
        );
        const txReceipt = this._executeTransaction(data, from);
        return txReceipt;
    }
    public getBalanceThresholdAddress(): string {
        return this._balanceThresholdFilter.address;
    }
    public getExchangeAddress(): string {
        return this._exchange.address;
    }
    // Exchange functions
    //abiEncodeFillOrder
    //getFillOrderResultsAsync
    //
    private async _executeTransaction(abiEncodedExchangeTxData: string, from: string, gas?: number): Promise<TransactionReceiptWithDecodedLogs> {
        const signedExchangeTx = this._signerTransactionFactory.newSignedTransaction(abiEncodedExchangeTxData);
        const txOpts = _.isUndefined(gas) ? {from} : {from, gas};
        const txHash = await this._balanceThresholdFilter.executeTransaction.sendTransactionAsync(
            signedExchangeTx.salt,
            signedExchangeTx.signerAddress,
            signedExchangeTx.data,
            signedExchangeTx.signature,
            txOpts,
        );
        const txReceipt = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return txReceipt;
    }
}
