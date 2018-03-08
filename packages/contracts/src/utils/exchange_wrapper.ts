import { TransactionReceiptWithDecodedLogs, ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { ExchangeContract } from '../contract_wrappers/generated/exchange';

import { constants } from './constants';
import { formatters } from './formatters';
import { LogDecoder } from './log_decoder';
import { orderUtils } from './order_utils';
import { SignedOrder } from './types';

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
        opts: { takerTokenFillAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerTokenFillAmount);
        const txHash = await this._exchange.fillOrder.sendTransactionAsync(
            params.order,
            params.takerTokenFillAmount,
            params.signature,
            { from },
        );
        const tx = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._exchange.address);
        tx.logs = _.map(tx.logs, log => {
            const logWithDecodedArgs = this._logDecoder.decodeLogOrThrow(log);
            wrapLogBigNumbers(logWithDecodedArgs);
            return logWithDecodedArgs;
        });
        return tx;
    }
    public async cancelOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerTokenCancelAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createCancel(signedOrder, opts.takerTokenCancelAmount);
        const txHash = await this._exchange.cancelOrder.sendTransactionAsync(
            params.order,
            params.takerTokenCancelAmount,
            { from },
        );
        const tx = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._exchange.address);
        tx.logs = _.map(tx.logs, log => {
            const logWithDecodedArgs = this._logDecoder.decodeLogOrThrow(log);
            wrapLogBigNumbers(logWithDecodedArgs);
            return logWithDecodedArgs;
        });
        return tx;
    }
    public async fillOrKillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerTokenFillAmount?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = orderUtils.createFill(signedOrder, opts.takerTokenFillAmount);
        const txHash = await this._exchange.fillOrKillOrder.sendTransactionAsync(
            params.order,
            params.takerTokenFillAmount,
            params.signature,
            { from },
        );
        const tx = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._exchange.address);
        tx.logs = _.map(tx.logs, log => {
            const logWithDecodedArgs = this._logDecoder.decodeLogOrThrow(log);
            wrapLogBigNumbers(logWithDecodedArgs);
            return logWithDecodedArgs;
        });
        return tx;
    }
    public async batchFillOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerTokenFillAmounts?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerTokenFillAmounts);
        const txHash = await this._exchange.batchFillOrders.sendTransactionAsync(
            params.orders,
            params.takerTokenFillAmounts,
            params.signatures,
            { from },
        );
        const tx = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._exchange.address);
        tx.logs = _.map(tx.logs, log => {
            const logWithDecodedArgs = this._logDecoder.decodeLogOrThrow(log);
            wrapLogBigNumbers(logWithDecodedArgs);
            return logWithDecodedArgs;
        });
        return tx;
    }
    public async batchFillOrKillOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerTokenFillAmounts?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchFill(orders, opts.takerTokenFillAmounts);
        const txHash = await this._exchange.batchFillOrKillOrders.sendTransactionAsync(
            params.orders,
            params.takerTokenFillAmounts,
            params.signatures,
            { from },
        );
        const tx = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._exchange.address);
        tx.logs = _.map(tx.logs, log => {
            const logWithDecodedArgs = this._logDecoder.decodeLogOrThrow(log);
            wrapLogBigNumbers(logWithDecodedArgs);
            return logWithDecodedArgs;
        });
        return tx;
    }
    public async marketFillOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerTokenFillAmount: BigNumber },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createMarketFillOrders(orders, opts.takerTokenFillAmount);
        const txHash = await this._exchange.marketFillOrders.sendTransactionAsync(
            params.orders,
            params.takerTokenFillAmount,
            params.signatures,
            { from },
        );
        const tx = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._exchange.address);
        tx.logs = _.map(tx.logs, log => {
            const logWithDecodedArgs = this._logDecoder.decodeLogOrThrow(log);
            wrapLogBigNumbers(logWithDecodedArgs);
            return logWithDecodedArgs;
        });
        return tx;
    }
    public async batchCancelOrdersAsync(
        orders: SignedOrder[],
        from: string,
        opts: { takerTokenCancelAmounts?: BigNumber[] } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = formatters.createBatchCancel(orders, opts.takerTokenCancelAmounts);
        const txHash = await this._exchange.batchCancelOrders.sendTransactionAsync(
            params.orders,
            params.takerTokenCancelAmounts,
            { from },
        );
        const tx = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._exchange.address);
        tx.logs = _.map(tx.logs, log => {
            const logWithDecodedArgs = this._logDecoder.decodeLogOrThrow(log);
            wrapLogBigNumbers(logWithDecodedArgs);
            return logWithDecodedArgs;
        });
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
    public async getFilledTakerTokenAmountAsync(orderHashHex: string): Promise<BigNumber> {
        const filledAmount = new BigNumber(await this._exchange.filled.callAsync(orderHashHex));
        return filledAmount;
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
