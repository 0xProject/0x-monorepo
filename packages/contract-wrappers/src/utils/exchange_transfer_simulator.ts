import { ExchangeContractErrs } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { AbstractBalanceAndProxyAllowanceLazyStore } from '../abstract/abstract_balance_and_proxy_allowance_lazy_store';
import { TradeSide, TransferType } from '../types';
import { constants } from '../utils/constants';

enum FailureReason {
    Balance = 'balance',
    ProxyAllowance = 'proxyAllowance',
}

const ERR_MSG_MAPPING = {
    [FailureReason.Balance]: {
        [TradeSide.Maker]: {
            [TransferType.Trade]: ExchangeContractErrs.InsufficientMakerBalance,
            [TransferType.Fee]: ExchangeContractErrs.InsufficientMakerFeeBalance,
        },
        [TradeSide.Taker]: {
            [TransferType.Trade]: ExchangeContractErrs.InsufficientTakerBalance,
            [TransferType.Fee]: ExchangeContractErrs.InsufficientTakerFeeBalance,
        },
    },
    [FailureReason.ProxyAllowance]: {
        [TradeSide.Maker]: {
            [TransferType.Trade]: ExchangeContractErrs.InsufficientMakerAllowance,
            [TransferType.Fee]: ExchangeContractErrs.InsufficientMakerFeeAllowance,
        },
        [TradeSide.Taker]: {
            [TransferType.Trade]: ExchangeContractErrs.InsufficientTakerAllowance,
            [TransferType.Fee]: ExchangeContractErrs.InsufficientTakerFeeAllowance,
        },
    },
};

export class ExchangeTransferSimulator {
    private readonly _store: AbstractBalanceAndProxyAllowanceLazyStore;
    private static _throwValidationError(
        failureReason: FailureReason,
        tradeSide: TradeSide,
        transferType: TransferType,
    ): never {
        const errMsg = ERR_MSG_MAPPING[failureReason][tradeSide][transferType];
        throw new Error(errMsg);
    }
    constructor(store: AbstractBalanceAndProxyAllowanceLazyStore) {
        this._store = store;
    }
    /**
     * Simulates transferFrom call performed by a proxy
     * @param  tokenAddress      Address of the token to be transferred
     * @param  from              Owner of the transferred tokens
     * @param  to                Recipient of the transferred tokens
     * @param  amountInBaseUnits The amount of tokens being transferred
     * @param  tradeSide         Is Maker/Taker transferring
     * @param  transferType      Is it a fee payment or a value transfer
     */
    public async transferFromAsync(
        tokenAddress: string,
        from: string,
        to: string,
        amountInBaseUnits: BigNumber,
        tradeSide: TradeSide,
        transferType: TransferType,
    ): Promise<void> {
        // HACK: When simulating an open order (e.g taker is NULL_ADDRESS), we don't want to adjust balances/
        // allowances for the taker. We do however, want to increase the balance of the maker since the maker
        // might be relying on those funds to fill subsequent orders or pay the order's fees.
        if (from === constants.NULL_ADDRESS && tradeSide === TradeSide.Taker) {
            await this._increaseBalanceAsync(tokenAddress, to, amountInBaseUnits);
            return;
        }
        const balance = await this._store.getBalanceAsync(tokenAddress, from);
        const proxyAllowance = await this._store.getProxyAllowanceAsync(tokenAddress, from);
        if (proxyAllowance.isLessThan(amountInBaseUnits)) {
            ExchangeTransferSimulator._throwValidationError(FailureReason.ProxyAllowance, tradeSide, transferType);
        }
        if (balance.isLessThan(amountInBaseUnits)) {
            ExchangeTransferSimulator._throwValidationError(FailureReason.Balance, tradeSide, transferType);
        }
        await this._decreaseProxyAllowanceAsync(tokenAddress, from, amountInBaseUnits);
        await this._decreaseBalanceAsync(tokenAddress, from, amountInBaseUnits);
        await this._increaseBalanceAsync(tokenAddress, to, amountInBaseUnits);
    }
    private async _decreaseProxyAllowanceAsync(
        tokenAddress: string,
        userAddress: string,
        amountInBaseUnits: BigNumber,
    ): Promise<void> {
        const proxyAllowance = await this._store.getProxyAllowanceAsync(tokenAddress, userAddress);
        if (!proxyAllowance.eq(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS)) {
            this._store.setProxyAllowance(tokenAddress, userAddress, proxyAllowance.minus(amountInBaseUnits));
        }
    }
    private async _increaseBalanceAsync(
        tokenAddress: string,
        userAddress: string,
        amountInBaseUnits: BigNumber,
    ): Promise<void> {
        const balance = await this._store.getBalanceAsync(tokenAddress, userAddress);
        this._store.setBalance(tokenAddress, userAddress, balance.plus(amountInBaseUnits));
    }
    private async _decreaseBalanceAsync(
        tokenAddress: string,
        userAddress: string,
        amountInBaseUnits: BigNumber,
    ): Promise<void> {
        const balance = await this._store.getBalanceAsync(tokenAddress, userAddress);
        this._store.setBalance(tokenAddress, userAddress, balance.minus(amountInBaseUnits));
    }
}
