import { TransactionReceiptWithDecodedLogs, ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { ExchangeContract } from '../contract_wrappers/generated/exchange';

import { constants } from './constants';
import { formatters } from './formatters';
import { LogDecoder } from './log_decoder';
import { orderUtils } from './order_utils';
import { AssetProxyId, SignedOrder } from './types';

export class ExchangeWrapper {
    private _exchange: ExchangeContract;
    private _logDecoder: LogDecoder = new LogDecoder(constants.TESTRPC_NETWORK_ID);
    private _zeroEx: ZeroEx;
    constructor(exchangeContract: ExchangeContract, zeroEx: ZeroEx) {
        this._exchange = exchangeContract;
        this._zeroEx = zeroEx;
    }
    public async fillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber; defaultParamsId?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount, opts.defaultParamsId);
        const txHash = await this._exchange.fillOrder.sendTransactionAsync(
            params.order,
            params.takerAssetFillAmount,
            params.defaultParamsId,
            params.signature,
            { from },
        );
        const tx = await this._getTxWithDecodedExchangeLogsAsync(txHash);
        return tx;
    }
    public async cancelOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { defaultParamsId?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createCancel(signedOrder, opts.defaultParamsId);
        const txHash = await this._exchange.cancelOrder.sendTransactionAsync(params.order, params.defaultParamsIds, {
            from,
        });
        const tx = await this._getTxWithDecodedExchangeLogsAsync(txHash);
        return tx;
    }
    public async fillOrKillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber; defaultParamsId?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount, opts.defaultParamsId);
        const txHash = await this._exchange.fillOrKillOrder.sendTransactionAsync(
            params.order,
            params.takerAssetFillAmount,
            params.defaultParamsId,
            params.signature,
            { from },
        );
        const tx = await this._getTxWithDecodedExchangeLogsAsync(txHash);
        return tx;
    }
    public async fillOrderNoThrowAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber; defaultParamsId?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount, opts.defaultParamsId);
        const txHash = await this._exchange.fillOrderNoThrow.sendTransactionAsync(
            params.order,
            params.takerAssetFillAmount,
            params.defaultParamsId,
            params.signature,
            { from },
        );
        const tx = await this._getTxWithDecodedExchangeLogsAsync(txHash);
        return tx;
    }
    public async batchFillOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[]; defaultParamsIds?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerAssetFillAmounts, opts.defaultParamsIds);
        const txHash = await this._exchange.batchFillOrders.sendTransactionAsync(
            params.orders,
            params.takerAssetFillAmounts,
            params.defaultParamsIds,
            params.signatures,
            { from },
        );
        const tx = await this._getTxWithDecodedExchangeLogsAsync(txHash);
        return tx;
    }
    public async batchFillOrKillOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[]; defaultParamsIds?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerAssetFillAmounts, opts.defaultParamsIds);
        const txHash = await this._exchange.batchFillOrKillOrders.sendTransactionAsync(
            params.orders,
            params.takerAssetFillAmounts,
            params.defaultParamsIds,
            params.signatures,
            { from },
        );
        const tx = await this._getTxWithDecodedExchangeLogsAsync(txHash);
        return tx;
    }
    public async batchFillOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmounts?: BigNumber[]; defaultParamsIds?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerAssetFillAmounts, opts.defaultParamsIds);
        const txHash = await this._exchange.batchFillOrdersNoThrow.sendTransactionAsync(
            params.orders,
            params.takerAssetFillAmounts,
            params.defaultParamsIds,
            params.signatures,
            { from },
        );
        const tx = await this._getTxWithDecodedExchangeLogsAsync(txHash);
        return tx;
    }
    public async marketSellOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmount: BigNumber; defaultParamsIds?: BigNumber[] },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketSellOrders(orders, opts.takerAssetFillAmount, opts.defaultParamsIds);
        const txHash = await this._exchange.marketSellOrders.sendTransactionAsync(
            params.orders,
            params.takerAssetFillAmount,
            params.defaultParamsIds,
            params.signatures,
            { from },
        );
        const tx = await this._getTxWithDecodedExchangeLogsAsync(txHash);
        return tx;
    }
    public async marketSellOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerAssetFillAmount: BigNumber; defaultParamsIds?: BigNumber[] },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketSellOrders(orders, opts.takerAssetFillAmount, opts.defaultParamsIds);
        const txHash = await this._exchange.marketSellOrdersNoThrow.sendTransactionAsync(
            params.orders,
            params.takerAssetFillAmount,
            params.defaultParamsIds,
            params.signatures,
            { from },
        );
        const tx = await this._getTxWithDecodedExchangeLogsAsync(txHash);
        return tx;
    }
    public async marketBuyOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { makerAssetFillAmount: BigNumber; defaultParamsIds?: BigNumber[] },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketBuyOrders(orders, opts.makerAssetFillAmount, opts.defaultParamsIds);
        const txHash = await this._exchange.marketBuyOrders.sendTransactionAsync(
            params.orders,
            params.makerAssetFillAmount,
            params.defaultParamsIds,
            params.signatures,
            { from },
        );
        const tx = await this._getTxWithDecodedExchangeLogsAsync(txHash);
        return tx;
    }
    public async marketBuyOrdersNoThrowAsync(
        orders: SignedOrder[],
        from: string,
        opts: { makerAssetFillAmount: BigNumber; defaultParamsIds?: BigNumber[] },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketBuyOrders(orders, opts.makerAssetFillAmount, opts.defaultParamsIds);
        const txHash = await this._exchange.marketBuyOrdersNoThrow.sendTransactionAsync(
            params.orders,
            params.makerAssetFillAmount,
            params.defaultParamsIds,
            params.signatures,
            { from },
        );
        const tx = await this._getTxWithDecodedExchangeLogsAsync(txHash);
        return tx;
    }
    public async batchCancelOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { defaultParamsIds?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchCancel(orders, opts.defaultParamsIds);
        const txHash = await this._exchange.batchCancelOrders.sendTransactionAsync(
            params.orders,
            params.defaultParamsIds,
            { from },
        );
        const tx = await this._getTxWithDecodedExchangeLogsAsync(txHash);
        return tx;
    }
    public async cancelOrdersUpToAsync(salt: BigNumber, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const txHash = await this._exchange.cancelOrdersUpTo.sendTransactionAsync(salt, { from });
        const tx = await this._getTxWithDecodedExchangeLogsAsync(txHash);
        return tx;
    }
    public async registerAssetProxyAsync(
        assetProxyId: AssetProxyId,
        assetProxyAddress: string,
        from: string,
        opts: { oldAssetProxyAddressIfExists?: string } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const oldAssetProxyAddress = _.isUndefined(opts.oldAssetProxyAddressIfExists)
            ? ZeroEx.NULL_ADDRESS
            : opts.oldAssetProxyAddressIfExists;
        const txHash = await this._exchange.registerAssetProxy.sendTransactionAsync(
            assetProxyId,
            assetProxyAddress,
            oldAssetProxyAddress,
            { from },
        );
        const tx = await this._getTxWithDecodedExchangeLogsAsync(txHash);
        return tx;
    }
    public async getOrderHashAsync(signedOrder: SignedOrder): Promise<string> {
        const order = orderUtils.getOrderStruct(signedOrder);
        const orderHash = await this._exchange.getOrderHash.callAsync(order);
        return orderHash;
    }
    public async isValidSignatureAsync(signedOrder: SignedOrder): Promise<boolean> {
        const isValidSignature = await this._exchange.isValidSignature.callAsync(
            orderUtils.getOrderHashHex(signedOrder),
            signedOrder.makerAddress,
            signedOrder.signature,
        );
        return isValidSignature;
    }
    public async isRoundingErrorAsync(
        numerator: BigNumber,
        denominator: BigNumber,
        target: BigNumber,
    ): Promise<boolean> {
        const isRoundingError = await this._exchange.isRoundingError.callAsync(numerator, denominator, target);
        return isRoundingError;
    }
    public async getPartialAmountAsync(
        numerator: BigNumber,
        denominator: BigNumber,
        target: BigNumber,
    ): Promise<BigNumber> {
        const partialAmount = new BigNumber(
            await this._exchange.getPartialAmount.callAsync(numerator, denominator, target),
        );
        return partialAmount;
    }
    public async getTakerAssetFilledAmountAsync(orderHashHex: string): Promise<BigNumber> {
        const filledAmount = new BigNumber(await this._exchange.filled.callAsync(orderHashHex));
        return filledAmount;
    }
    private async _getTxWithDecodedExchangeLogsAsync(txHash: string) {
        const tx = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._exchange.address);
        tx.logs = _.map(tx.logs, log => this._logDecoder.decodeLogOrThrow(log));
        return tx;
    }
}
