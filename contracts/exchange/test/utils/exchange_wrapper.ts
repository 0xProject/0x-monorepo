import { BatchMatchOrder, orderUtils } from '@0x/contracts-test-utils';
import {
    BatchMatchedFillResults,
    FillResults,
    MatchedFillResults,
    OrderInfo,
    SignedOrder,
    SignedZeroExTransaction,
} from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import { MethodAbi, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { ExchangeContract } from '../wrappers';

import { AbiDecodedFillOrderData } from './types';

export class ExchangeWrapper {
    constructor(public readonly exchangeContract: ExchangeContract) {}

    public async fillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const txReceipt = await this.exchangeContract
            .fillOrder(params.order, params.takerAssetFillAmount, params.signature)
            .awaitTransactionSuccessAsync({ from });
        return txReceipt;
    }
    public async cancelOrderAsync(signedOrder: SignedOrder, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createCancel(signedOrder);
        const txReceipt = await this.exchangeContract.cancelOrder(params.order).awaitTransactionSuccessAsync({ from });
        return txReceipt;
    }
    public async fillOrKillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber; gasPrice?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const txReceipt = await this.exchangeContract
            .fillOrKillOrder(params.order, params.takerAssetFillAmount, params.signature)
            .awaitTransactionSuccessAsync({ from, gasPrice: opts.gasPrice });
        return txReceipt;
    }
    public async batchFillOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[]; gasPrice?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this.exchangeContract
            .batchFillOrders(
                orders,
                opts.takerAssetFillAmounts === undefined
                    ? orders.map(signedOrder => signedOrder.takerAssetAmount)
                    : opts.takerAssetFillAmounts,
                orders.map(signedOrder => signedOrder.signature),
            )
            .awaitTransactionSuccessAsync({ from, gasPrice: opts.gasPrice });
    }
    public async batchFillOrKillOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[]; gasPrice?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this.exchangeContract
            .batchFillOrKillOrders(
                orders,
                opts.takerAssetFillAmounts === undefined
                    ? orders.map(signedOrder => signedOrder.takerAssetAmount)
                    : opts.takerAssetFillAmounts,
                orders.map(signedOrder => signedOrder.signature),
            )
            .awaitTransactionSuccessAsync({ from, gasPrice: opts.gasPrice });
    }
    public async batchFillOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[]; gas?: number; gasPrice?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this.exchangeContract
            .batchFillOrdersNoThrow(
                orders,
                opts.takerAssetFillAmounts === undefined
                    ? orders.map(signedOrder => signedOrder.takerAssetAmount)
                    : opts.takerAssetFillAmounts,
                orders.map(signedOrder => signedOrder.signature),
            )
            .awaitTransactionSuccessAsync({ from, gas: opts.gas, gasPrice: opts.gasPrice });
    }
    public async marketSellOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmount: BigNumber; gas?: number; gasPrice?: BigNumber },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this.exchangeContract
            .marketSellOrdersNoThrow(
                orders,
                opts.takerAssetFillAmount,
                orders.map(signedOrder => signedOrder.signature),
            )
            .awaitTransactionSuccessAsync({ from, gas: opts.gas, gasPrice: opts.gasPrice });
    }
    public async marketBuyOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { makerAssetFillAmount: BigNumber; gas?: number; gasPrice?: BigNumber },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this.exchangeContract
            .marketBuyOrdersNoThrow(orders, opts.makerAssetFillAmount, orders.map(signedOrder => signedOrder.signature))
            .awaitTransactionSuccessAsync({ from, gas: opts.gas });
    }
    public async marketSellOrdersFillOrKillAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmount: BigNumber; gas?: number },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this.exchangeContract
            .marketSellOrdersFillOrKill(
                orders,
                opts.takerAssetFillAmount,
                orders.map(signedOrder => signedOrder.signature),
            )
            .awaitTransactionSuccessAsync({ from, gas: opts.gas });
    }
    public async marketBuyOrdersFillOrKillAsync(
        orders: SignedOrder[],
        from: string,
        opts: { makerAssetFillAmount: BigNumber; gas?: number },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this.exchangeContract
            .marketBuyOrdersFillOrKill(
                orders,
                opts.makerAssetFillAmount,
                orders.map(signedOrder => signedOrder.signature),
            )
            .awaitTransactionSuccessAsync({ from, gas: opts.gas });
    }
    public async batchCancelOrdersAsync(
        orders: SignedOrder[],
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this.exchangeContract.batchCancelOrders(orders).awaitTransactionSuccessAsync({ from });
    }
    public async cancelOrdersUpToAsync(salt: BigNumber, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const txReceipt = await this.exchangeContract.cancelOrdersUpTo(salt).awaitTransactionSuccessAsync({ from });
        return txReceipt;
    }
    public async registerAssetProxyAsync(
        assetProxyAddress: string,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const txReceipt = await this.exchangeContract
            .registerAssetProxy(assetProxyAddress)
            .awaitTransactionSuccessAsync({
                from,
            });
        return txReceipt;
    }
    public async executeTransactionAsync(
        signedTransaction: SignedZeroExTransaction,
        from: string,
        opts: { gasPrice?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this.exchangeContract
            .executeTransaction(signedTransaction, signedTransaction.signature)
            .awaitTransactionSuccessAsync({ from, gasPrice: opts.gasPrice });
    }
    public async batchExecuteTransactionsAsync(
        signedTransactions: SignedZeroExTransaction[],
        from: string,
        opts: { gasPrice?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const signatures = signedTransactions.map(signedTransaction => signedTransaction.signature);
        return this.exchangeContract
            .batchExecuteTransactions(signedTransactions, signatures)
            .awaitTransactionSuccessAsync({
                from,
                gasPrice: opts.gasPrice,
            });
    }
    public async getTakerAssetFilledAmountAsync(orderHashHex: string): Promise<BigNumber> {
        const filledAmount = await this.exchangeContract.filled(orderHashHex).callAsync();
        return filledAmount;
    }
    public async isCancelledAsync(orderHashHex: string): Promise<boolean> {
        const isCancelled = await this.exchangeContract.cancelled(orderHashHex).callAsync();
        return isCancelled;
    }
    public async getOrderEpochAsync(makerAddress: string, senderAddress: string): Promise<BigNumber> {
        const orderEpoch = await this.exchangeContract.orderEpoch(makerAddress, senderAddress).callAsync();
        return orderEpoch;
    }
    public async getOrderInfoAsync(signedOrder: SignedOrder): Promise<OrderInfo> {
        const orderInfo = await this.exchangeContract.getOrderInfo(signedOrder).callAsync();
        return orderInfo;
    }
    public async batchMatchOrdersAsync(
        signedOrdersLeft: SignedOrder[],
        signedOrdersRight: SignedOrder[],
        from: string,
        opts: { gasPrice?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createBatchMatchOrders(signedOrdersLeft, signedOrdersRight);
        return this.exchangeContract
            .batchMatchOrders(params.leftOrders, params.rightOrders, params.leftSignatures, params.rightSignatures)
            .awaitTransactionSuccessAsync({ from, gasPrice: opts.gasPrice });
    }
    public async batchMatchOrdersRawAsync(
        params: BatchMatchOrder,
        from: string,
        opts: { gasPrice?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this.exchangeContract
            .batchMatchOrders(params.leftOrders, params.rightOrders, params.leftSignatures, params.rightSignatures)
            .awaitTransactionSuccessAsync({ from, gasPrice: opts.gasPrice });
    }
    public async getBatchMatchOrdersResultsAsync(
        signedOrdersLeft: SignedOrder[],
        signedOrdersRight: SignedOrder[],
        from: string,
        opts: { gasPrice?: BigNumber } = {},
    ): Promise<BatchMatchedFillResults> {
        const params = orderUtils.createBatchMatchOrders(signedOrdersLeft, signedOrdersRight);
        const batchMatchedFillResults = await this.exchangeContract
            .batchMatchOrders(params.leftOrders, params.rightOrders, params.leftSignatures, params.rightSignatures)
            .callAsync({ from, gasPrice: opts.gasPrice });
        return batchMatchedFillResults;
    }
    public async batchMatchOrdersWithMaximalFillAsync(
        signedOrdersLeft: SignedOrder[],
        signedOrdersRight: SignedOrder[],
        from: string,
        opts: { gasPrice?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createBatchMatchOrders(signedOrdersLeft, signedOrdersRight);
        return this.exchangeContract
            .batchMatchOrdersWithMaximalFill(
                params.leftOrders,
                params.rightOrders,
                params.leftSignatures,
                params.rightSignatures,
            )
            .awaitTransactionSuccessAsync({ from, gasPrice: opts.gasPrice });
    }
    public async batchMatchOrdersWithMaximalFillRawAsync(
        params: BatchMatchOrder,
        from: string,
        opts: { gasPrice?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        return this.exchangeContract
            .batchMatchOrdersWithMaximalFill(
                params.leftOrders,
                params.rightOrders,
                params.leftSignatures,
                params.rightSignatures,
            )
            .awaitTransactionSuccessAsync({ from, gasPrice: opts.gasPrice });
    }
    public async getBatchMatchOrdersWithMaximalFillResultsAsync(
        signedOrdersLeft: SignedOrder[],
        signedOrdersRight: SignedOrder[],
        from: string,
        opts: { gasPrice?: BigNumber } = {},
    ): Promise<BatchMatchedFillResults> {
        const params = orderUtils.createBatchMatchOrders(signedOrdersLeft, signedOrdersRight);
        const batchMatchedFillResults = await this.exchangeContract
            .batchMatchOrdersWithMaximalFill(
                params.leftOrders,
                params.rightOrders,
                params.leftSignatures,
                params.rightSignatures,
            )
            .callAsync({ from, gasPrice: opts.gasPrice });
        return batchMatchedFillResults;
    }
    public async matchOrdersAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        from: string,
        opts: { gasPrice?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createMatchOrders(signedOrderLeft, signedOrderRight);
        const txReceipt = await this.exchangeContract
            .matchOrders(params.left, params.right, params.leftSignature, params.rightSignature)
            .awaitTransactionSuccessAsync({ from, gasPrice: opts.gasPrice });
        return txReceipt;
    }
    public async getMatchOrdersResultsAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        from: string,
        opts: { gasPrice?: BigNumber } = {},
    ): Promise<MatchedFillResults> {
        const params = orderUtils.createMatchOrders(signedOrderLeft, signedOrderRight);
        const matchedFillResults = await this.exchangeContract
            .matchOrders(params.left, params.right, params.leftSignature, params.rightSignature)
            .callAsync({ from, gasPrice: opts.gasPrice });
        return matchedFillResults;
    }
    public async matchOrdersWithMaximalFillAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        from: string,
        opts: { gasPrice?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createMatchOrders(signedOrderLeft, signedOrderRight);
        return this.exchangeContract
            .matchOrdersWithMaximalFill(params.left, params.right, params.leftSignature, params.rightSignature)
            .awaitTransactionSuccessAsync({ from, gasPrice: opts.gasPrice });
    }
    public async getMatchOrdersWithMaximalFillResultsAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        from: string,
        opts: { gasPrice?: BigNumber },
    ): Promise<MatchedFillResults> {
        const params = orderUtils.createMatchOrders(signedOrderLeft, signedOrderRight);
        const matchedFillResults = await this.exchangeContract
            .matchOrdersWithMaximalFill(params.left, params.right, params.leftSignature, params.rightSignature)
            .callAsync({ from, gasPrice: opts.gasPrice });
        return matchedFillResults;
    }
    public async getFillOrderResultsAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber; gasPrice?: BigNumber } = {},
    ): Promise<FillResults> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const fillResults = await this.exchangeContract
            .fillOrder(params.order, params.takerAssetFillAmount, params.signature)
            .callAsync({ from, gasPrice: opts.gasPrice });
        return fillResults;
    }
    public abiEncodeFillOrder(signedOrder: SignedOrder, opts: { takerAssetFillAmount?: BigNumber } = {}): string {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const data = this.exchangeContract
            .fillOrder(params.order, params.takerAssetFillAmount, params.signature)
            .getABIEncodedTransactionData();
        return data;
    }
    public abiDecodeFillOrder(data: string): AbiDecodedFillOrderData {
        // Lookup fillOrder ABI in exchange abi
        const fillOrderAbi = _.find(this.exchangeContract.abi, { name: 'fillOrder' }) as MethodAbi;
        // Decode input data
        const abiEncoder = new AbiEncoder.Method(fillOrderAbi);
        const decodedData = abiEncoder.decode(data) as AbiDecodedFillOrderData;
        return decodedData;
    }
}
