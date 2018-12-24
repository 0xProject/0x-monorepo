import {
    FillResults,
    formatters,
    LogDecoder,
    OrderInfo,
    orderUtils,
    SignedTransaction,
} from '@0x/contracts-test-utils';
import { artifacts as tokensArtifacts } from '@0x/contracts-tokens';
import { OrderWithoutExchangeAddress, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { AbiDefinition, MethodAbi, Provider, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';
import { AbiEncoder } from '@0x/utils';

import { ExchangeContract } from '../../generated-wrappers/exchange';
import { artifacts } from '../../src/artifacts';

export class ExchangeWrapper {
    private readonly _exchange: ExchangeContract;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _logDecoder: LogDecoder;
    constructor(exchangeContract: ExchangeContract, provider: Provider) {
        this._exchange = exchangeContract;
        this._web3Wrapper = new Web3Wrapper(provider);
        this._logDecoder = new LogDecoder(this._web3Wrapper, { ...artifacts, ...tokensArtifacts });
    }
    public async fillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const txHash = await this._exchange.fillOrder.sendTransactionAsync(
            params.order,
            params.takerAssetFillAmount,
            params.signature,
            { from },
        );
        const txReceipt = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return txReceipt;
    }
    public async cancelOrderAsync(signedOrder: SignedOrder, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createCancel(signedOrder);
        const txHash = await this._exchange.cancelOrder.sendTransactionAsync(params.order, { from });
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async fillOrKillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const txHash = await this._exchange.fillOrKillOrder.sendTransactionAsync(
            params.order,
            params.takerAssetFillAmount,
            params.signature,
            { from },
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async fillOrderNoThrowAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber; gas?: number } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const txHash = await this._exchange.fillOrderNoThrow.sendTransactionAsync(
            params.order,
            params.takerAssetFillAmount,
            params.signature,
            { from, gas: opts.gas },
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async batchFillOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerAssetFillAmounts);
        const txHash = await this._exchange.batchFillOrders.sendTransactionAsync(
            params.orders,
            params.takerAssetFillAmounts,
            params.signatures,
            { from },
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async batchFillOrKillOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerAssetFillAmounts);
        const txHash = await this._exchange.batchFillOrKillOrders.sendTransactionAsync(
            params.orders,
            params.takerAssetFillAmounts,
            params.signatures,
            { from },
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async batchFillOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[]; gas?: number } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerAssetFillAmounts);
        const txHash = await this._exchange.batchFillOrdersNoThrow.sendTransactionAsync(
            params.orders,
            params.takerAssetFillAmounts,
            params.signatures,
            { from, gas: opts.gas },
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async marketSellOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmount: BigNumber },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketSellOrders(orders, opts.takerAssetFillAmount);
        const txHash = await this._exchange.marketSellOrders.sendTransactionAsync(
            params.orders,
            params.takerAssetFillAmount,
            params.signatures,
            { from },
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async marketSellOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmount: BigNumber; gas?: number },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketSellOrders(orders, opts.takerAssetFillAmount);
        const txHash = await this._exchange.marketSellOrdersNoThrow.sendTransactionAsync(
            params.orders,
            params.takerAssetFillAmount,
            params.signatures,
            { from, gas: opts.gas },
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async marketBuyOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { makerAssetFillAmount: BigNumber },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketBuyOrders(orders, opts.makerAssetFillAmount);
        const txHash = await this._exchange.marketBuyOrders.sendTransactionAsync(
            params.orders,
            params.makerAssetFillAmount,
            params.signatures,
            { from },
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async marketBuyOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { makerAssetFillAmount: BigNumber; gas?: number },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketBuyOrders(orders, opts.makerAssetFillAmount);
        const txHash = await this._exchange.marketBuyOrdersNoThrow.sendTransactionAsync(
            params.orders,
            params.makerAssetFillAmount,
            params.signatures,
            { from, gas: opts.gas },
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async batchCancelOrdersAsync(
        orders: SignedOrder[],
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchCancel(orders);
        const txHash = await this._exchange.batchCancelOrders.sendTransactionAsync(params.orders, { from });
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async cancelOrdersUpToAsync(salt: BigNumber, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const txHash = await this._exchange.cancelOrdersUpTo.sendTransactionAsync(salt, { from });
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async registerAssetProxyAsync(
        assetProxyAddress: string,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const txHash = await this._exchange.registerAssetProxy.sendTransactionAsync(assetProxyAddress, { from });
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async executeTransactionAsync(
        signedTx: SignedTransaction,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const txHash = await this._exchange.executeTransaction.sendTransactionAsync(
            signedTx.salt,
            signedTx.signerAddress,
            signedTx.data,
            signedTx.signature,
            { from },
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
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
        const txHash = await this._exchange.matchOrders.sendTransactionAsync(
            params.left,
            params.right,
            params.leftSignature,
            params.rightSignature,
            { from },
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
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
    // @TODO hysz -- Remove once abi decoding has been added to contract templates
    public abiDecodeFillOrder(
        data: string,
    ): { order: OrderWithoutExchangeAddress; takerAssetFillAmount: BigNumber; signature: string } {
        // Lookup fillOrder ABI
        let fillOrderAbi = _.find(this._exchange.abi, (value: AbiDefinition) => {
            if (value.type === 'function' && (value as MethodAbi).name === 'fillOrder') {
                return true;
            }
            return false;
        }) as MethodAbi;
        // Decode input data
        const abiEncoder = new AbiEncoder.Method(fillOrderAbi);
        const decodedData = abiEncoder.decode(data) as {
            order: OrderWithoutExchangeAddress;
            takerAssetFillAmount: BigNumber;
            signature: string;
        };
        return decodedData;
    }
    public getExchangeAddress(): string {
        return this._exchange.address;
    }
}
