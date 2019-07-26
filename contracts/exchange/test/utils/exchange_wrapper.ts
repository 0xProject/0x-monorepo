import { FillResults, formatters, OrderInfo, orderUtils, Web3ProviderEngine } from '@0x/contracts-test-utils';
import { SignedOrder, SignedZeroExTransaction } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { MethodAbi, TransactionReceiptWithDecodedLogs, ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { ExchangeContract } from '../../src';

import { AbiDecodedFillOrderData } from './types';

export class ExchangeWrapper {
    private readonly _exchange: ExchangeContract;
    // tslint:disable no-unused-variable
    private readonly _web3Wrapper: Web3Wrapper;
    constructor(exchangeContract: ExchangeContract, provider: Web3ProviderEngine | ZeroExProvider) {
        this._exchange = exchangeContract;
        this._web3Wrapper = new Web3Wrapper(provider);
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
        const params = formatters.createBatchFill(orders, opts.takerAssetFillAmounts);
        const txReceipt = await this._exchange.batchFillOrders.awaitTransactionSuccessAsync(
            params.orders,
            params.takerAssetFillAmounts,
            params.signatures,
            { from },
        );
        return txReceipt;
    }
    public async batchFillOrKillOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerAssetFillAmounts);
        const txReceipt = await this._exchange.batchFillOrKillOrders.awaitTransactionSuccessAsync(
            params.orders,
            params.takerAssetFillAmounts,
            params.signatures,
            { from },
        );
        return txReceipt;
    }
    public async batchFillOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[]; gas?: number } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerAssetFillAmounts);
        const txReceipt = await this._exchange.batchFillOrdersNoThrow.awaitTransactionSuccessAsync(
            params.orders,
            params.takerAssetFillAmounts,
            params.signatures,
            { from, gas: opts.gas },
        );
        return txReceipt;
    }
    public async marketSellOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmount: BigNumber },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketSellOrders(orders, opts.takerAssetFillAmount);
        const txReceipt = await this._exchange.marketSellOrders.awaitTransactionSuccessAsync(
            params.orders,
            params.takerAssetFillAmount,
            params.signatures,
            { from },
        );
        return txReceipt;
    }
    public async marketSellOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmount: BigNumber; gas?: number },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketSellOrders(orders, opts.takerAssetFillAmount);
        const txReceipt = await this._exchange.marketSellOrdersNoThrow.awaitTransactionSuccessAsync(
            params.orders,
            params.takerAssetFillAmount,
            params.signatures,
            { from, gas: opts.gas },
        );
        return txReceipt;
    }
    public async marketBuyOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { makerAssetFillAmount: BigNumber },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketBuyOrders(orders, opts.makerAssetFillAmount);
        const txReceipt = await this._exchange.marketBuyOrders.awaitTransactionSuccessAsync(
            params.orders,
            params.makerAssetFillAmount,
            params.signatures,
            { from },
        );
        return txReceipt;
    }
    public async marketBuyOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { makerAssetFillAmount: BigNumber; gas?: number },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketBuyOrders(orders, opts.makerAssetFillAmount);
        const txReceipt = await this._exchange.marketBuyOrdersNoThrow.awaitTransactionSuccessAsync(
            params.orders,
            params.makerAssetFillAmount,
            params.signatures,
            { from, gas: opts.gas },
        );
        return txReceipt;
    }
    public async batchCancelOrdersAsync(
        orders: SignedOrder[],
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchCancel(orders);
        const txReceipt = await this._exchange.batchCancelOrders.awaitTransactionSuccessAsync(params.orders, { from });
        return txReceipt;
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
        signedTx: SignedZeroExTransaction,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const txReceipt = await this._exchange.executeTransaction.awaitTransactionSuccessAsync(
            signedTx.salt,
            signedTx.signerAddress,
            signedTx.data,
            signedTx.signature,
            { from },
        );
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
        const orderInfo = await this._exchange.getOrderInfo.callAsync(signedOrder);
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
        const txReceipt = await this._exchange.matchOrders.awaitTransactionSuccessAsync(
            params.left,
            params.right,
            params.leftSignature,
            params.rightSignature,
            { from },
        );
        return txReceipt;
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
