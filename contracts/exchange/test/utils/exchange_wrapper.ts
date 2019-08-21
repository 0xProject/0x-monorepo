import { BatchMatchOrder, orderUtils, Web3ProviderEngine } from '@0x/contracts-test-utils';
import {
    BatchMatchedFillResults,
    FillResults,
    MatchedFillResults,
    OrderInfo,
    SignedOrder,
    SignedZeroExTransaction,
} from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import { MethodAbi, TransactionReceiptWithDecodedLogs, ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { ExchangeContract } from '../../src';

import { AbiDecodedFillOrderData } from './types';

export class ExchangeWrapper {
    private readonly _exchange: ExchangeContract;
    // tslint:disable no-unused-variable
    constructor(exchangeContract: ExchangeContract, provider: Web3ProviderEngine | ZeroExProvider) {
        this._exchange = exchangeContract;
    }
    public async fillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const txReceipt = await this._exchange.fillOrder.awaitTransactionSuccessAsync(
            params.order,
            params.takerAssetFillAmount,
            params.signature,
            { from },
        );
        return txReceipt;
    }
    public async cancelOrderAsync(signedOrder: SignedOrder, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createCancel(signedOrder);
        const txReceipt = await this._exchange.cancelOrder.awaitTransactionSuccessAsync(params.order, { from });
        return txReceipt;
    }
    public async fillOrKillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const txReceipt = await this._exchange.fillOrKillOrder.awaitTransactionSuccessAsync(
            params.order,
            params.takerAssetFillAmount,
            params.signature,
            { from },
        );
        return txReceipt;
    }
    public async fillOrderNoThrowAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber; gas?: number } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const txReceipt = await this._exchange.fillOrderNoThrow.awaitTransactionSuccessAsync(
            params.order,
            params.takerAssetFillAmount,
            params.signature,
            { from, gas: opts.gas },
        );
        return txReceipt;
    }
    public async batchFillOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this._exchange.batchFillOrders.awaitTransactionSuccessAsync(
            orders,
            opts.takerAssetFillAmounts === undefined
                ? orders.map(signedOrder => signedOrder.takerAssetAmount)
                : opts.takerAssetFillAmounts,
            orders.map(signedOrder => signedOrder.signature),
            { from },
        );
    }
    public async batchFillOrKillOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this._exchange.batchFillOrKillOrders.awaitTransactionSuccessAsync(
            orders,
            opts.takerAssetFillAmounts === undefined
                ? orders.map(signedOrder => signedOrder.takerAssetAmount)
                : opts.takerAssetFillAmounts,
            orders.map(signedOrder => signedOrder.signature),
            { from },
        );
    }
    public async batchFillOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[]; gas?: number } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this._exchange.batchFillOrdersNoThrow.awaitTransactionSuccessAsync(
            orders,
            opts.takerAssetFillAmounts === undefined
                ? orders.map(signedOrder => signedOrder.takerAssetAmount)
                : opts.takerAssetFillAmounts,
            orders.map(signedOrder => signedOrder.signature),
            { from, gas: opts.gas },
        );
    }
    public async marketSellOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmount: BigNumber; gas?: number },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this._exchange.marketSellOrdersNoThrow.awaitTransactionSuccessAsync(
            orders,
            opts.takerAssetFillAmount,
            orders.map(signedOrder => signedOrder.signature),
            { from, gas: opts.gas },
        );
    }
    public async marketBuyOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { makerAssetFillAmount: BigNumber; gas?: number },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this._exchange.marketBuyOrdersNoThrow.awaitTransactionSuccessAsync(
            orders,
            opts.makerAssetFillAmount,
            orders.map(signedOrder => signedOrder.signature),
            { from, gas: opts.gas },
        );
    }
    public async marketSellOrdersFillOrKillAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmount: BigNumber; gas?: number },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this._exchange.marketSellOrdersFillOrKill.awaitTransactionSuccessAsync(
            orders,
            opts.takerAssetFillAmount,
            orders.map(signedOrder => signedOrder.signature),
            { from, gas: opts.gas },
        );
    }
    public async marketBuyOrdersFillOrKillAsync(
        orders: SignedOrder[],
        from: string,
        opts: { makerAssetFillAmount: BigNumber; gas?: number },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this._exchange.marketBuyOrdersFillOrKill.awaitTransactionSuccessAsync(
            orders,
            opts.makerAssetFillAmount,
            orders.map(signedOrder => signedOrder.signature),
            { from, gas: opts.gas },
        );
    }
    public async batchCancelOrdersAsync(
        orders: SignedOrder[],
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this._exchange.batchCancelOrders.awaitTransactionSuccessAsync(orders, { from });
    }
    public async cancelOrdersUpToAsync(salt: BigNumber, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const txReceipt = await this._exchange.cancelOrdersUpTo.awaitTransactionSuccessAsync(salt, { from });
        return txReceipt;
    }
    public async registerAssetProxyAsync(
        assetProxyAddress: string,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const txReceipt = await this._exchange.registerAssetProxy.awaitTransactionSuccessAsync(assetProxyAddress, {
            from,
        });
        return txReceipt;
    }
    public async executeTransactionAsync(
        signedTransaction: SignedZeroExTransaction,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this._exchange.executeTransaction.awaitTransactionSuccessAsync(
            signedTransaction,
            signedTransaction.signature,
            {
                from,
            },
        );
    }
    public async batchExecuteTransactionsAsync(
        signedTransactions: SignedZeroExTransaction[],
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const signatures = signedTransactions.map(signedTransaction => signedTransaction.signature);
        return this._exchange.batchExecuteTransactions.awaitTransactionSuccessAsync(signedTransactions, signatures, {
            from,
        });
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
        const orderInfo = await this._exchange.getOrderInfo.callAsync(signedOrder);
        return orderInfo;
    }
    public async getOrdersInfoAsync(signedOrders: SignedOrder[]): Promise<OrderInfo[]> {
        const ordersInfo = (await this._exchange.getOrdersInfo.callAsync(signedOrders)) as OrderInfo[];
        return ordersInfo;
    }
    public async batchMatchOrdersAsync(
        signedOrdersLeft: SignedOrder[],
        signedOrdersRight: SignedOrder[],
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createBatchMatchOrders(signedOrdersLeft, signedOrdersRight);
        return this._exchange.batchMatchOrders.awaitTransactionSuccessAsync(
            params.leftOrders,
            params.rightOrders,
            params.leftSignatures,
            params.rightSignatures,
            { from },
        );
    }
    public async batchMatchOrdersRawAsync(
        params: BatchMatchOrder,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this._exchange.batchMatchOrders.awaitTransactionSuccessAsync(
            params.leftOrders,
            params.rightOrders,
            params.leftSignatures,
            params.rightSignatures,
            { from },
        );
    }
    public async getBatchMatchOrdersResultsAsync(
        signedOrdersLeft: SignedOrder[],
        signedOrdersRight: SignedOrder[],
        from: string,
    ): Promise<BatchMatchedFillResults> {
        const params = orderUtils.createBatchMatchOrders(signedOrdersLeft, signedOrdersRight);
        const batchMatchedFillResults = await this._exchange.batchMatchOrders.callAsync(
            params.leftOrders,
            params.rightOrders,
            params.leftSignatures,
            params.rightSignatures,
            { from },
        );
        return batchMatchedFillResults;
    }
    public async batchMatchOrdersWithMaximalFillAsync(
        signedOrdersLeft: SignedOrder[],
        signedOrdersRight: SignedOrder[],
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createBatchMatchOrders(signedOrdersLeft, signedOrdersRight);
        return this._exchange.batchMatchOrdersWithMaximalFill.awaitTransactionSuccessAsync(
            params.leftOrders,
            params.rightOrders,
            params.leftSignatures,
            params.rightSignatures,
            { from },
        );
    }
    public async batchMatchOrdersWithMaximalFillRawAsync(
        params: BatchMatchOrder,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this._exchange.batchMatchOrdersWithMaximalFill.awaitTransactionSuccessAsync(
            params.leftOrders,
            params.rightOrders,
            params.leftSignatures,
            params.rightSignatures,
            { from },
        );
    }
    public async getBatchMatchOrdersWithMaximalFillResultsAsync(
        signedOrdersLeft: SignedOrder[],
        signedOrdersRight: SignedOrder[],
        from: string,
    ): Promise<BatchMatchedFillResults> {
        const params = orderUtils.createBatchMatchOrders(signedOrdersLeft, signedOrdersRight);
        const batchMatchedFillResults = await this._exchange.batchMatchOrdersWithMaximalFill.callAsync(
            params.leftOrders,
            params.rightOrders,
            params.leftSignatures,
            params.rightSignatures,
            { from },
        );
        return batchMatchedFillResults;
    }
    public async matchOrdersAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createMatchOrders(signedOrderLeft, signedOrderRight);
        const txReceipt = await this._exchange.matchOrders.awaitTransactionSuccessAsync(
            params.left,
            params.right,
            params.leftSignature,
            params.rightSignature,
            { from },
        );
        return txReceipt;
    }
    public async getMatchOrdersResultsAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        from: string,
    ): Promise<MatchedFillResults> {
        const params = orderUtils.createMatchOrders(signedOrderLeft, signedOrderRight);
        const matchedFillResults = await this._exchange.matchOrders.callAsync(
            params.left,
            params.right,
            params.leftSignature,
            params.rightSignature,
            { from },
        );
        return matchedFillResults;
    }
    public async matchOrdersWithMaximalFillAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createMatchOrders(signedOrderLeft, signedOrderRight);
        return this._exchange.matchOrdersWithMaximalFill.awaitTransactionSuccessAsync(
            params.left,
            params.right,
            params.leftSignature,
            params.rightSignature,
            { from },
        );
    }
    public async getMatchOrdersWithMaximalFillResultsAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        from: string,
    ): Promise<MatchedFillResults> {
        const params = orderUtils.createMatchOrders(signedOrderLeft, signedOrderRight);
        const matchedFillResults = await this._exchange.matchOrdersWithMaximalFill.callAsync(
            params.left,
            params.right,
            params.leftSignature,
            params.rightSignature,
            { from },
        );
        return matchedFillResults;
    }
    public async getFillOrderResultsAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber } = {},
    ): Promise<FillResults> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const fillResults = await this._exchange.fillOrder.callAsync(
            params.order,
            params.takerAssetFillAmount,
            params.signature,
            { from },
        );
        return fillResults;
    }
    public abiEncodeFillOrder(signedOrder: SignedOrder, opts: { takerAssetFillAmount?: BigNumber } = {}): string {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const data = this._exchange.fillOrder.getABIEncodedTransactionData(
            params.order,
            params.takerAssetFillAmount,
            params.signature,
        );
        return data;
    }
    public abiDecodeFillOrder(data: string): AbiDecodedFillOrderData {
        // Lookup fillOrder ABI in exchange abi
        const fillOrderAbi = _.find(this._exchange.abi, { name: 'fillOrder' }) as MethodAbi;
        // Decode input data
        const abiEncoder = new AbiEncoder.Method(fillOrderAbi);
        const decodedData = abiEncoder.decode(data) as AbiDecodedFillOrderData;
        return decodedData;
    }
    public getExchangeAddress(): string {
        return this._exchange.address;
    }
}
