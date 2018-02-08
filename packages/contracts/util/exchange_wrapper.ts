import { TransactionReceiptWithDecodedLogs, ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { ExchangeContract } from '../src/contract_wrappers/generated/exchange';

import { formatters } from './formatters';
import { Order } from './order';

export class ExchangeWrapper {
    private _exchange: ExchangeContract;
    private _zeroEx: ZeroEx;
    constructor(exchangeContract: ExchangeContract, zeroEx: ZeroEx) {
        this._exchange = exchangeContract;
        this._zeroEx = zeroEx;
    }
    public async fillOrderAsync(
        order: Order,
        from: string,
        opts: { takerTokenFillAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = order.createFill(opts.takerTokenFillAmount);
        const txHash = await this._exchange.fillOrder.sendTransactionAsync(
            params.orderAddresses,
            params.orderValues,
            params.takerTokenFillAmount,
            params.v as number,
            params.r as string,
            params.s as string,
            { from },
        );
        const tx = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._exchange.address);
        _.each(tx.logs, log => wrapLogBigNumbers(log));
        return tx;
    }
    public async cancelOrderAsync(
        order: Order,
        from: string,
        opts: { takerTokenCancelAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = order.createCancel(opts.takerTokenCancelAmount);
        const txHash = await this._exchange.cancelOrder.sendTransactionAsync(
            params.orderAddresses,
            params.orderValues,
            params.takerTokenCancelAmount,
            { from },
        );
        const tx = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._exchange.address);
        _.each(tx.logs, log => wrapLogBigNumbers(log));
        return tx;
    }
    public async fillOrKillOrderAsync(
        order: Order,
        from: string,
        opts: { takerTokenFillAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = order.createFill(opts.takerTokenFillAmount);
        const txHash = await this._exchange.fillOrKillOrder.sendTransactionAsync(
            params.orderAddresses,
            params.orderValues,
            params.takerTokenFillAmount,
            params.v as number,
            params.r as string,
            params.s as string,
            { from },
        );
        const tx = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._exchange.address);
        _.each(tx.logs, log => wrapLogBigNumbers(log));
        return tx;
    }
    public async batchFillOrdersAsync(
        orders: Order[],
        from: string,
        opts: {
            takerTokenFillAmounts?: BigNumber[];
            shouldThrowOnInsufficientBalanceOrAllowance?: boolean;
        } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerTokenFillAmounts);
        const txHash = await this._exchange.batchFillOrders.sendTransactionAsync(
            params.orderAddresses,
            params.orderValues,
            params.takerTokenFillAmounts,
            params.v,
            params.r,
            params.s,
            { from },
        );
        const tx = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._exchange.address);
        _.each(tx.logs, log => wrapLogBigNumbers(log));
        return tx;
    }
    public async batchFillOrKillOrdersAsync(
        orders: Order[],
        from: string,
        opts: { takerTokenFillAmounts?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerTokenFillAmounts);
        const txHash = await this._exchange.batchFillOrKillOrders.sendTransactionAsync(
            params.orderAddresses,
            params.orderValues,
            params.takerTokenFillAmounts,
            params.v,
            params.r,
            params.s,
            { from },
        );
        const tx = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._exchange.address);
        _.each(tx.logs, log => wrapLogBigNumbers(log));
        return tx;
    }
    public async marketFillOrdersAsync(
        orders: Order[],
        from: string,
        opts: { takerTokenFillAmount: BigNumber },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketFillOrders(orders, opts.takerTokenFillAmount);
        const txHash = await this._exchange.marketFillOrders.sendTransactionAsync(
            params.orderAddresses,
            params.orderValues,
            params.takerTokenFillAmount,
            params.v,
            params.r,
            params.s,
            { from },
        );
        const tx = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._exchange.address);
        _.each(tx.logs, log => wrapLogBigNumbers(log));
        return tx;
    }
    public async batchCancelOrdersAsync(
        orders: Order[],
        from: string,
        opts: { cancelTakerTokenAmounts?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchCancel(orders, opts.cancelTakerTokenAmounts);
        const txHash = await this._exchange.batchCancelOrders.sendTransactionAsync(
            params.orderAddresses,
            params.orderValues,
            params.cancelTakerTokenAmounts,
            { from },
        );
        const tx = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._exchange.address);
        _.each(tx.logs, log => wrapLogBigNumbers(log));
        return tx;
    }
    public async getOrderHashAsync(order: Order): Promise<string> {
        const params = order.createFill();
        const orderHash = await this._exchange.getOrderHash(params.orderAddresses, params.orderValues);
        return orderHash;
    }
    public async isValidSignatureAsync(order: Order): Promise<boolean> {
        const isValidSignature = await this._exchange.isValidSignature(
            order.params.maker,
            order.params.orderHashHex as string,
            order.params.v as number,
            order.params.r as string,
            order.params.s as string,
        );
        return isValidSignature;
    }
    public async isRoundingErrorAsync(
        numerator: BigNumber,
        denominator: BigNumber,
        target: BigNumber,
    ): Promise<boolean> {
        const isRoundingError = await this._exchange.isRoundingError(numerator, denominator, target);
        return isRoundingError;
    }
    public async getPartialAmountAsync(
        numerator: BigNumber,
        denominator: BigNumber,
        target: BigNumber,
    ): Promise<BigNumber> {
        const partialAmount = new BigNumber(await this._exchange.getPartialAmount(numerator, denominator, target));
        return partialAmount;
    }
}

function wrapLogBigNumbers(log: any): any {
    const argNames = _.keys(log.args);
    for (const argName of argNames) {
        const isWeb3BigNumber = _.startsWith(log.args[argName].constructor.toString(), 'function BigNumber(');
        if (isWeb3BigNumber) {
            log.args[argName] = new BigNumber(log.args[argName]);
        }
    }
}
