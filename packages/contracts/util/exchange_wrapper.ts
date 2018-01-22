import { ExchangeContractEventArgs, TransactionReceiptWithDecodedLogs, ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { formatters } from './formatters';
import { Order } from './order';

export class ExchangeWrapper {
    private _exchange: Web3.ContractInstance;
    private _zeroEx: ZeroEx;
    constructor(exchangeContractInstance: Web3.ContractInstance, zeroEx: ZeroEx) {
        this._exchange = exchangeContractInstance;
        this._zeroEx = zeroEx;
    }
    public async fillOrderAsync(
        order: Order,
        from: string,
        opts: {
            fillTakerTokenAmount?: BigNumber;
            shouldThrowOnInsufficientBalanceOrAllowance?: boolean;
        } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const shouldThrowOnInsufficientBalanceOrAllowance = !!opts.shouldThrowOnInsufficientBalanceOrAllowance;
        const params = order.createFill(shouldThrowOnInsufficientBalanceOrAllowance, opts.fillTakerTokenAmount);
        const txHash = await this._exchange.fillOrder(
            params.orderAddresses,
            params.orderValues,
            params.fillTakerTokenAmount,
            params.shouldThrowOnInsufficientBalanceOrAllowance,
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
    public async cancelOrderAsync(
        order: Order,
        from: string,
        opts: { cancelTakerTokenAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = order.createCancel(opts.cancelTakerTokenAmount);
        const txHash = await this._exchange.cancelOrder(
            params.orderAddresses,
            params.orderValues,
            params.cancelTakerTokenAmount,
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
        opts: { fillTakerTokenAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const shouldThrowOnInsufficientBalanceOrAllowance = true;
        const params = order.createFill(shouldThrowOnInsufficientBalanceOrAllowance, opts.fillTakerTokenAmount);
        const txHash = await this._exchange.fillOrKillOrder(
            params.orderAddresses,
            params.orderValues,
            params.fillTakerTokenAmount,
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
    public async batchFillOrdersAsync(
        orders: Order[],
        from: string,
        opts: {
            fillTakerTokenAmounts?: BigNumber[];
            shouldThrowOnInsufficientBalanceOrAllowance?: boolean;
        } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const shouldThrowOnInsufficientBalanceOrAllowance = !!opts.shouldThrowOnInsufficientBalanceOrAllowance;
        const params = formatters.createBatchFill(
            orders,
            shouldThrowOnInsufficientBalanceOrAllowance,
            opts.fillTakerTokenAmounts,
        );
        const txHash = await this._exchange.batchFillOrders(
            params.orderAddresses,
            params.orderValues,
            params.fillTakerTokenAmounts,
            params.shouldThrowOnInsufficientBalanceOrAllowance,
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
        opts: { fillTakerTokenAmounts?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, undefined, opts.fillTakerTokenAmounts);
        const txHash = await this._exchange.batchFillOrKillOrders(
            params.orderAddresses,
            params.orderValues,
            params.fillTakerTokenAmounts,
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
    public async fillOrdersUpToAsync(
        orders: Order[],
        from: string,
        opts: {
            fillTakerTokenAmount?: BigNumber;
            shouldThrowOnInsufficientBalanceOrAllowance?: boolean;
        } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const shouldThrowOnInsufficientBalanceOrAllowance = !!opts.shouldThrowOnInsufficientBalanceOrAllowance;
        const params = formatters.createFillUpTo(
            orders,
            shouldThrowOnInsufficientBalanceOrAllowance,
            opts.fillTakerTokenAmount,
        );
        const txHash = await this._exchange.fillOrdersUpTo(
            params.orderAddresses,
            params.orderValues,
            params.fillTakerTokenAmount,
            params.shouldThrowOnInsufficientBalanceOrAllowance,
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
        const txHash = await this._exchange.batchCancelOrders(
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
        const shouldThrowOnInsufficientBalanceOrAllowance = false;
        const params = order.createFill(shouldThrowOnInsufficientBalanceOrAllowance);
        const orderHash = await this._exchange.getOrderHash(params.orderAddresses, params.orderValues);
        return orderHash;
    }
    public async isValidSignatureAsync(order: Order): Promise<boolean> {
        const isValidSignature = await this._exchange.isValidSignature(
            order.params.maker,
            order.params.orderHashHex,
            order.params.v,
            order.params.r,
            order.params.s,
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
