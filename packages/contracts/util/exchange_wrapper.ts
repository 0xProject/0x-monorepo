import { BigNumber } from 'bignumber.js';
import * as _ from 'lodash';

import { formatters } from './formatters';
import { Order } from './order';
import { ContractInstance } from './types';

export class ExchangeWrapper {
    private _exchange: ContractInstance;
    constructor(exchangeContractInstance: ContractInstance) {
        this._exchange = exchangeContractInstance;
    }
    public async fillOrderAsync(
        order: Order,
        from: string,
        opts: {
            fillTakerTokenAmount?: BigNumber;
            shouldThrowOnInsufficientBalanceOrAllowance?: boolean;
        } = {},
    ) {
        const shouldThrowOnInsufficientBalanceOrAllowance = !!opts.shouldThrowOnInsufficientBalanceOrAllowance;
        const params = order.createFill(shouldThrowOnInsufficientBalanceOrAllowance, opts.fillTakerTokenAmount);
        const tx = await this._exchange.fillOrder(
            params.orderAddresses,
            params.orderValues,
            params.fillTakerTokenAmount,
            params.shouldThrowOnInsufficientBalanceOrAllowance,
            params.v,
            params.r,
            params.s,
            { from },
        );
        _.each(tx.logs, log => wrapLogBigNumbers(log));
        return tx;
    }
    public async cancelOrderAsync(order: Order, from: string, opts: { cancelTakerTokenAmount?: BigNumber } = {}) {
        const params = order.createCancel(opts.cancelTakerTokenAmount);
        const tx = await this._exchange.cancelOrder(
            params.orderAddresses,
            params.orderValues,
            params.cancelTakerTokenAmount,
            { from },
        );
        _.each(tx.logs, log => wrapLogBigNumbers(log));
        return tx;
    }
    public async fillOrKillOrderAsync(order: Order, from: string, opts: { fillTakerTokenAmount?: BigNumber } = {}) {
        const shouldThrowOnInsufficientBalanceOrAllowance = true;
        const params = order.createFill(shouldThrowOnInsufficientBalanceOrAllowance, opts.fillTakerTokenAmount);
        const tx = await this._exchange.fillOrKillOrder(
            params.orderAddresses,
            params.orderValues,
            params.fillTakerTokenAmount,
            params.v,
            params.r,
            params.s,
            { from },
        );
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
    ) {
        const shouldThrowOnInsufficientBalanceOrAllowance = !!opts.shouldThrowOnInsufficientBalanceOrAllowance;
        const params = formatters.createBatchFill(
            orders,
            shouldThrowOnInsufficientBalanceOrAllowance,
            opts.fillTakerTokenAmounts,
        );
        const tx = await this._exchange.batchFillOrders(
            params.orderAddresses,
            params.orderValues,
            params.fillTakerTokenAmounts,
            params.shouldThrowOnInsufficientBalanceOrAllowance,
            params.v,
            params.r,
            params.s,
            { from },
        );
        _.each(tx.logs, log => wrapLogBigNumbers(log));
        return tx;
    }
    public async batchFillOrKillOrdersAsync(
        orders: Order[],
        from: string,
        opts: { fillTakerTokenAmounts?: BigNumber[] } = {},
    ) {
        const params = formatters.createBatchFill(orders, undefined, opts.fillTakerTokenAmounts);
        const tx = await this._exchange.batchFillOrKillOrders(
            params.orderAddresses,
            params.orderValues,
            params.fillTakerTokenAmounts,
            params.v,
            params.r,
            params.s,
            { from },
        );
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
    ) {
        const shouldThrowOnInsufficientBalanceOrAllowance = !!opts.shouldThrowOnInsufficientBalanceOrAllowance;
        const params = formatters.createFillUpTo(
            orders,
            shouldThrowOnInsufficientBalanceOrAllowance,
            opts.fillTakerTokenAmount,
        );
        const tx = await this._exchange.fillOrdersUpTo(
            params.orderAddresses,
            params.orderValues,
            params.fillTakerTokenAmount,
            params.shouldThrowOnInsufficientBalanceOrAllowance,
            params.v,
            params.r,
            params.s,
            { from },
        );
        _.each(tx.logs, log => wrapLogBigNumbers(log));
        return tx;
    }
    public async batchCancelOrdersAsync(
        orders: Order[],
        from: string,
        opts: { cancelTakerTokenAmounts?: BigNumber[] } = {},
    ) {
        const params = formatters.createBatchCancel(orders, opts.cancelTakerTokenAmounts);
        const tx = await this._exchange.batchCancelOrders(
            params.orderAddresses,
            params.orderValues,
            params.cancelTakerTokenAmounts,
            { from },
        );
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
