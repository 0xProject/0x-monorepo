import { SignedOrder, TransactionReceiptWithDecodedLogs, ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { ExchangeContract } from '../src/contract_wrappers/generated/exchange';

import { formatters } from './formatters';
import { signedOrderUtils } from './signed_order_utils';

export class ExchangeWrapper {
    private _exchange: ExchangeContract;
    private _zeroEx: ZeroEx;
    constructor(exchangeContract: ExchangeContract, zeroEx: ZeroEx) {
        this._exchange = exchangeContract;
        this._zeroEx = zeroEx;
    }
    public async fillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: {
            fillTakerTokenAmount?: BigNumber;
            shouldThrowOnInsufficientBalanceOrAllowance?: boolean;
        } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const shouldThrowOnInsufficientBalanceOrAllowance = !!opts.shouldThrowOnInsufficientBalanceOrAllowance;
        const params = signedOrderUtils.createFill(
            signedOrder,
            shouldThrowOnInsufficientBalanceOrAllowance,
            opts.fillTakerTokenAmount,
        );
        const txHash = await this._exchange.fillOrder.sendTransactionAsync(
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
        signedOrder: SignedOrder,
        from: string,
        opts: { cancelTakerTokenAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = signedOrderUtils.createCancel(signedOrder, opts.cancelTakerTokenAmount);
        const txHash = await this._exchange.cancelOrder.sendTransactionAsync(
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
        signedOrder: SignedOrder,
        from: string,
        opts: { fillTakerTokenAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const shouldThrowOnInsufficientBalanceOrAllowance = true;
        const params = signedOrderUtils.createFill(
            signedOrder,
            shouldThrowOnInsufficientBalanceOrAllowance,
            opts.fillTakerTokenAmount,
        );
        const txHash = await this._exchange.fillOrKillOrder.sendTransactionAsync(
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
        orders: SignedOrder[],
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
        const txHash = await this._exchange.batchFillOrders.sendTransactionAsync(
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
        orders: SignedOrder[],
        from: string,
        opts: { fillTakerTokenAmounts?: BigNumber[]; shouldThrowOnInsufficientBalanceOrAllowance?: boolean } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const shouldThrowOnInsufficientBalanceOrAllowance = !!opts.shouldThrowOnInsufficientBalanceOrAllowance;
        const params = formatters.createBatchFill(
            orders,
            shouldThrowOnInsufficientBalanceOrAllowance,
            opts.fillTakerTokenAmounts,
        );
        const txHash = await this._exchange.batchFillOrKillOrders.sendTransactionAsync(
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
        orders: SignedOrder[],
        from: string,
        opts: { fillTakerTokenAmount: BigNumber; shouldThrowOnInsufficientBalanceOrAllowance?: boolean },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const shouldThrowOnInsufficientBalanceOrAllowance = !!opts.shouldThrowOnInsufficientBalanceOrAllowance;
        const params = formatters.createFillUpTo(
            orders,
            shouldThrowOnInsufficientBalanceOrAllowance,
            opts.fillTakerTokenAmount,
        );
        const txHash = await this._exchange.fillOrdersUpTo.sendTransactionAsync(
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
        orders: SignedOrder[],
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
    public async getOrderHashAsync(signedOrder: SignedOrder): Promise<string> {
        const shouldThrowOnInsufficientBalanceOrAllowance = false;
        const params = signedOrderUtils.getOrderAddressesAndValues(signedOrder);
        const orderHash = await this._exchange.getOrderHash.callAsync(params.orderAddresses, params.orderValues);
        return orderHash;
    }
    public async isValidSignatureAsync(signedOrder: SignedOrder): Promise<boolean> {
        const isValidSignature = await this._exchange.isValidSignature.callAsync(
            signedOrder.maker,
            ZeroEx.getOrderHashHex(signedOrder),
            signedOrder.ecSignature.v,
            signedOrder.ecSignature.r,
            signedOrder.ecSignature.s,
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
