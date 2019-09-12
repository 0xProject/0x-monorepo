import { expect } from '@0x/contracts-test-utils';
import { BigNumber, RevertError } from '@0x/utils';
import * as _ from 'lodash';

import { StakingApiWrapper } from '../utils/api_wrapper';
import { StakeBalance, StakeBalances, StakeInfo, StakeStatus } from '../utils/types';

import { BaseActor } from './base_actor';

export class StakerActor extends BaseActor {
    private readonly _poolIds: string[];

    private static _incrementNextBalance(balance: StakeBalance, amount: BigNumber): void {
        balance.nextEpochBalance = balance.nextEpochBalance.plus(amount);
    }
    private static _decrementNextBalance(balance: StakeBalance, amount: BigNumber): void {
        balance.nextEpochBalance = balance.nextEpochBalance.minus(amount);
    }
    private static _incrementCurrentAndNextBalance(balance: StakeBalance, amount: BigNumber): void {
        balance.currentEpochBalance = balance.currentEpochBalance.plus(amount);
        balance.nextEpochBalance = balance.nextEpochBalance.plus(amount);
    }
    private static _decrementCurrentAndNextBalance(balance: StakeBalance, amount: BigNumber): void {
        balance.currentEpochBalance = balance.currentEpochBalance.minus(amount);
        balance.nextEpochBalance = balance.nextEpochBalance.minus(amount);
    }

    constructor(owner: string, stakingApiWrapper: StakingApiWrapper) {
        super(owner, stakingApiWrapper);
        this._poolIds = [];
    }

    public async stakeAndMoveAsync(
        from: StakeInfo,
        to: StakeInfo,
        amount: BigNumber,
        revertError?: RevertError,
    ): Promise<void> {
        const initZrxBalanceOfVault = await this._stakingApiWrapper.utils.getZrxTokenBalanceOfZrxVaultAsync();
        const initBalances = await this._getBalancesAsync();
        // move stake
        const txReceiptPromise = this._stakingApiWrapper.stakingProxyContract.batchExecute.awaitTransactionSuccessAsync(
            [
                this._stakingApiWrapper.stakingContract.stake.getABIEncodedTransactionData(amount),
                this._stakingApiWrapper.stakingContract.moveStake.getABIEncodedTransactionData(from, to, amount),
            ],
            { from: this._owner },
        );
        if (revertError !== undefined) {
            await expect(txReceiptPromise, 'expected revert error').to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // Calculate the expected stake amount.
        const expectedBalances = await this._calculateExpectedBalancesAfterMoveAsync(
            from,
            to,
            amount,
            await this._calculateExpectedBalancesAfterStakeAsync(amount, initBalances),
        );
        await this._assertBalancesAsync(expectedBalances);
        // check zrx balance of vault
        const finalZrxBalanceOfVault = await this._stakingApiWrapper.utils.getZrxTokenBalanceOfZrxVaultAsync();
        expect(finalZrxBalanceOfVault, 'final balance of zrx vault').to.be.bignumber.equal(
            initZrxBalanceOfVault.plus(amount),
        );
    }

    public async stakeAsync(amount: BigNumber, revertError?: RevertError): Promise<void> {
        const initZrxBalanceOfVault = await this._stakingApiWrapper.utils.getZrxTokenBalanceOfZrxVaultAsync();
        const initBalances = await this._getBalancesAsync();
        // deposit stake
        const txReceiptPromise = this._stakingApiWrapper.stakingContract.stake.awaitTransactionSuccessAsync(amount, {
            from: this._owner,
        });
        if (revertError !== undefined) {
            await expect(txReceiptPromise, 'expected revert error').to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // @TODO check receipt logs and return value via eth_call
        // check balances
        const expectedBalances = await this._calculateExpectedBalancesAfterStakeAsync(amount, initBalances);
        await this._assertBalancesAsync(expectedBalances);
        // check zrx balance of vault
        const finalZrxBalanceOfVault = await this._stakingApiWrapper.utils.getZrxTokenBalanceOfZrxVaultAsync();
        expect(finalZrxBalanceOfVault, 'final balance of zrx vault').to.be.bignumber.equal(
            initZrxBalanceOfVault.plus(amount),
        );
    }

    public async unstakeAsync(amount: BigNumber, revertError?: RevertError): Promise<void> {
        const initZrxBalanceOfVault = await this._stakingApiWrapper.utils.getZrxTokenBalanceOfZrxVaultAsync();
        const initBalances = await this._getBalancesAsync();
        // deposit stake
        const txReceiptPromise = this._stakingApiWrapper.stakingContract.unstake.awaitTransactionSuccessAsync(amount, {
            from: this._owner,
        });
        if (revertError !== undefined) {
            await expect(txReceiptPromise, 'expected revert error').to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // @TODO check receipt logs and return value via eth_call
        // check balances
        const expectedBalances = initBalances;
        expectedBalances.zrxBalance = initBalances.zrxBalance.plus(amount);
        expectedBalances.stakeBalanceInVault = initBalances.stakeBalanceInVault.minus(amount);
        StakerActor._decrementCurrentAndNextBalance(expectedBalances.inactiveStakeBalance, amount);
        StakerActor._decrementCurrentAndNextBalance(expectedBalances.globalInactiveStakeBalance, amount);
        expectedBalances.withdrawableStakeBalance = initBalances.withdrawableStakeBalance.minus(amount);
        await this._assertBalancesAsync(expectedBalances);
        // check zrx balance of vault
        const finalZrxBalanceOfVault = await this._stakingApiWrapper.utils.getZrxTokenBalanceOfZrxVaultAsync();
        expect(finalZrxBalanceOfVault, 'final balance of zrx vault').to.be.bignumber.equal(
            initZrxBalanceOfVault.minus(amount),
        );
    }

    public async moveStakeAsync(
        from: StakeInfo,
        to: StakeInfo,
        amount: BigNumber,
        revertError?: RevertError,
    ): Promise<void> {
        // Cache Initial Balances.
        const initZrxBalanceOfVault = await this._stakingApiWrapper.utils.getZrxTokenBalanceOfZrxVaultAsync();
        // Calculate the expected outcome after the move.
        const expectedBalances = await this._calculateExpectedBalancesAfterMoveAsync(from, to, amount);
        // move stake
        const txReceiptPromise = this._stakingApiWrapper.stakingContract.moveStake.awaitTransactionSuccessAsync(
            from,
            to,
            amount,
            { from: this._owner },
        );
        if (revertError !== undefined) {
            await expect(txReceiptPromise).to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // check balances
        await this._assertBalancesAsync(expectedBalances);
        // check zrx balance of vault
        const finalZrxBalanceOfVault = await this._stakingApiWrapper.utils.getZrxTokenBalanceOfZrxVaultAsync();
        expect(finalZrxBalanceOfVault, 'final balance of zrx vault').to.be.bignumber.equal(initZrxBalanceOfVault);
    }

    public async goToNextEpochAsync(): Promise<void> {
        // cache balances
        const initZrxBalanceOfVault = await this._stakingApiWrapper.utils.getZrxTokenBalanceOfZrxVaultAsync();
        const initBalances = await this._getBalancesAsync();
        // go to next epoch
        await this._stakingApiWrapper.utils.skipToNextEpochAsync();
        // check balances
        const expectedBalances = this._getNextEpochBalances(initBalances);
        await this._assertBalancesAsync(expectedBalances);
        // check zrx balance of vault
        const finalZrxBalanceOfVault = await this._stakingApiWrapper.utils.getZrxTokenBalanceOfZrxVaultAsync();
        expect(finalZrxBalanceOfVault, 'final balance of zrx vault').to.be.bignumber.equal(initZrxBalanceOfVault);
    }
    private _getNextEpochBalances(balances: StakeBalances): StakeBalances {
        const nextBalances = _.cloneDeep(balances);
        nextBalances.withdrawableStakeBalance = nextBalances.inactiveStakeBalance.nextEpochBalance.isLessThan(
            nextBalances.inactiveStakeBalance.currentEpochBalance,
        )
            ? nextBalances.inactiveStakeBalance.nextEpochBalance
            : nextBalances.inactiveStakeBalance.currentEpochBalance;

        for (const balance of [
            nextBalances.activeStakeBalance,
            nextBalances.inactiveStakeBalance,
            nextBalances.delegatedStakeBalance,
            nextBalances.globalActiveStakeBalance,
            nextBalances.globalInactiveStakeBalance,
            nextBalances.globalDelegatedStakeBalance,
            ...this._poolIds.map(poolId => nextBalances.delegatedStakeByPool[poolId]),
            ...this._poolIds.map(poolId => nextBalances.totalDelegatedStakeByPool[poolId]),
        ]) {
            balance.currentEpochBalance = balance.nextEpochBalance;
        }
        return nextBalances;
    }
    private async _getBalancesAsync(): Promise<StakeBalances> {
        const balances: StakeBalances = {
            zrxBalance: await this._stakingApiWrapper.zrxTokenContract.balanceOf.callAsync(this._owner),
            stakeBalance: await this._stakingApiWrapper.stakingContract.getTotalStake.callAsync(this._owner),
            stakeBalanceInVault: await this._stakingApiWrapper.zrxVaultContract.balanceOf.callAsync(this._owner),
            withdrawableStakeBalance: await this._stakingApiWrapper.stakingContract.getWithdrawableStake.callAsync(
                this._owner,
            ),
            activeStakeBalance: await this._stakingApiWrapper.stakingContract.getActiveStake.callAsync(this._owner),
            inactiveStakeBalance: await this._stakingApiWrapper.stakingContract.getInactiveStake.callAsync(this._owner),
            delegatedStakeBalance: await this._stakingApiWrapper.stakingContract.getStakeDelegatedByOwner.callAsync(
                this._owner,
            ),
            globalActiveStakeBalance: await this._stakingApiWrapper.stakingContract.getGlobalActiveStake.callAsync(),
            globalInactiveStakeBalance: await this._stakingApiWrapper.stakingContract.getGlobalInactiveStake.callAsync(),
            globalDelegatedStakeBalance: await this._stakingApiWrapper.stakingContract.getGlobalDelegatedStake.callAsync(),
            delegatedStakeByPool: {},
            totalDelegatedStakeByPool: {},
        };
        // lookup for each pool
        for (const poolId of this._poolIds) {
            const delegatedStakeBalanceByPool = await this._stakingApiWrapper.stakingContract.getStakeDelegatedToPoolByOwner.callAsync(
                this._owner,
                poolId,
            );
            const totalDelegatedStakeBalanceByPool = await this._stakingApiWrapper.stakingContract.getTotalStakeDelegatedToPool.callAsync(
                poolId,
            );
            balances.delegatedStakeByPool[poolId] = delegatedStakeBalanceByPool;
            balances.totalDelegatedStakeByPool[poolId] = totalDelegatedStakeBalanceByPool;
        }
        return balances;
    }
    private async _assertBalancesAsync(expectedBalances: StakeBalances): Promise<void> {
        const balances = await this._getBalancesAsync();
        expect(balances.zrxBalance, 'zrx balance').to.be.bignumber.equal(expectedBalances.zrxBalance);
        expect(balances.stakeBalanceInVault, 'stake balance, recorded in vault').to.be.bignumber.equal(
            expectedBalances.stakeBalanceInVault,
        );
        expect(balances.withdrawableStakeBalance, 'withdrawable stake balance').to.be.bignumber.equal(
            expectedBalances.withdrawableStakeBalance,
        );
        expect(balances.activeStakeBalance.currentEpochBalance, 'active stake balance (current)').to.be.bignumber.equal(
            expectedBalances.activeStakeBalance.currentEpochBalance,
        );
        expect(balances.activeStakeBalance.nextEpochBalance, 'active stake balance (next)').to.be.bignumber.equal(
            expectedBalances.activeStakeBalance.nextEpochBalance,
        );
        expect(
            balances.inactiveStakeBalance.currentEpochBalance,
            'inactive stake balance (current)',
        ).to.be.bignumber.equal(expectedBalances.inactiveStakeBalance.currentEpochBalance);
        expect(balances.inactiveStakeBalance.nextEpochBalance, 'inactive stake balance (next)').to.be.bignumber.equal(
            expectedBalances.inactiveStakeBalance.nextEpochBalance,
        );
        expect(
            balances.delegatedStakeBalance.currentEpochBalance,
            'delegated stake balance (current)',
        ).to.be.bignumber.equal(expectedBalances.delegatedStakeBalance.currentEpochBalance);
        expect(balances.delegatedStakeBalance.nextEpochBalance, 'delegated stake balance (next)').to.be.bignumber.equal(
            expectedBalances.delegatedStakeBalance.nextEpochBalance,
        );
        expect(
            balances.globalActiveStakeBalance.currentEpochBalance,
            'global active stake (current)',
        ).to.bignumber.equal(expectedBalances.globalActiveStakeBalance.currentEpochBalance);
        expect(
            balances.globalInactiveStakeBalance.currentEpochBalance,
            'global inactive stake (current)',
        ).to.bignumber.equal(expectedBalances.globalInactiveStakeBalance.currentEpochBalance);
        expect(
            balances.globalDelegatedStakeBalance.currentEpochBalance,
            'global delegated stake (current)',
        ).to.bignumber.equal(expectedBalances.globalDelegatedStakeBalance.currentEpochBalance);
        expect(balances.globalActiveStakeBalance.nextEpochBalance, 'global active stake (next)').to.bignumber.equal(
            expectedBalances.globalActiveStakeBalance.nextEpochBalance,
        );
        expect(balances.globalInactiveStakeBalance.nextEpochBalance, 'global inactive stake (next)').to.bignumber.equal(
            expectedBalances.globalInactiveStakeBalance.nextEpochBalance,
        );
        expect(
            balances.globalDelegatedStakeBalance.nextEpochBalance,
            'global delegated stake (next)',
        ).to.bignumber.equal(expectedBalances.globalDelegatedStakeBalance.nextEpochBalance);
        expect(balances.delegatedStakeByPool, 'delegated stake by pool').to.be.deep.equal(
            expectedBalances.delegatedStakeByPool,
        );
        expect(balances.totalDelegatedStakeByPool, 'total delegated stake by pool').to.be.deep.equal(
            expectedBalances.totalDelegatedStakeByPool,
        );
    }

    private async _calculateExpectedBalancesAfterMoveAsync(
        from: StakeInfo,
        to: StakeInfo,
        amount: BigNumber,
        initBalances?: StakeBalances,
    ): Promise<StakeBalances> {
        // check if we're moving stake into a new pool
        if (to.status === StakeStatus.Delegated && to.poolId !== undefined && !_.includes(this._poolIds, to.poolId)) {
            this._poolIds.push(to.poolId);
        }
        // cache balances
        const expectedBalances = initBalances || (await this._getBalancesAsync());
        // @TODO check receipt logs and return value via eth_call
        // check balances
        // from
        if (from.status === StakeStatus.Active) {
            StakerActor._decrementNextBalance(expectedBalances.activeStakeBalance, amount);
            StakerActor._decrementNextBalance(expectedBalances.globalActiveStakeBalance, amount);
        } else if (from.status === StakeStatus.Inactive) {
            StakerActor._decrementNextBalance(expectedBalances.inactiveStakeBalance, amount);
            StakerActor._decrementNextBalance(expectedBalances.globalInactiveStakeBalance, amount);
            if (
                expectedBalances.inactiveStakeBalance.nextEpochBalance.isLessThan(
                    expectedBalances.withdrawableStakeBalance,
                )
            ) {
                expectedBalances.withdrawableStakeBalance = expectedBalances.inactiveStakeBalance.nextEpochBalance;
            }
        } else if (from.status === StakeStatus.Delegated && from.poolId !== undefined) {
            StakerActor._decrementNextBalance(expectedBalances.delegatedStakeBalance, amount);
            StakerActor._decrementNextBalance(expectedBalances.globalDelegatedStakeBalance, amount);
            StakerActor._decrementNextBalance(expectedBalances.delegatedStakeByPool[from.poolId], amount);
            StakerActor._decrementNextBalance(expectedBalances.totalDelegatedStakeByPool[from.poolId], amount);
        }
        // to
        if (to.status === StakeStatus.Active) {
            StakerActor._incrementNextBalance(expectedBalances.activeStakeBalance, amount);
            StakerActor._incrementNextBalance(expectedBalances.globalActiveStakeBalance, amount);
        } else if (to.status === StakeStatus.Inactive) {
            StakerActor._incrementNextBalance(expectedBalances.inactiveStakeBalance, amount);
            StakerActor._incrementNextBalance(expectedBalances.globalInactiveStakeBalance, amount);
        } else if (to.status === StakeStatus.Delegated && to.poolId !== undefined) {
            StakerActor._incrementNextBalance(expectedBalances.delegatedStakeBalance, amount);
            StakerActor._incrementNextBalance(expectedBalances.globalDelegatedStakeBalance, amount);
            StakerActor._incrementNextBalance(expectedBalances.delegatedStakeByPool[to.poolId], amount);
            StakerActor._incrementNextBalance(expectedBalances.totalDelegatedStakeByPool[to.poolId], amount);
        }
        return expectedBalances;
    }

    private async _calculateExpectedBalancesAfterStakeAsync(
        amount: BigNumber,
        initBalances?: StakeBalances,
    ): Promise<StakeBalances> {
        const expectedBalances = initBalances || (await this._getBalancesAsync());
        // check balances
        expectedBalances.zrxBalance = expectedBalances.zrxBalance.minus(amount);
        expectedBalances.stakeBalanceInVault = expectedBalances.stakeBalanceInVault.plus(amount);
        StakerActor._incrementCurrentAndNextBalance(expectedBalances.activeStakeBalance, amount);
        StakerActor._incrementCurrentAndNextBalance(expectedBalances.globalActiveStakeBalance, amount);
        return expectedBalances;
    }
}
