import { expect } from '@0x/contracts-test-utils';
import { BigNumber, RevertError } from '@0x/utils';
import * as _ from 'lodash';

import { StakingWrapper } from '../utils/staking_wrapper';
import { StakeBalances, StakeBalanceByPool, StakeStateInfo, StakeState } from '../utils/types';

import { BaseActor } from './base_actor';


export class StakerActor extends BaseActor {

    private poolIds: string[];

    constructor(owner: string, stakingWrapper: StakingWrapper) {
        super(owner, stakingWrapper);
        this.poolIds = [];
    }

    public async stakeAsync(amount: BigNumber, revertError?: RevertError): Promise<void> {
        const initZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVaultAsync();
        const initStakerBalances = await this.getBalancesAsync();
        // deposit stake
        const txReceiptPromise = this._stakingWrapper.stakeAsync(this._owner, amount);
        if (revertError !== undefined) {
            await expect(txReceiptPromise).to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // @TODO check receipt logs and return value via eth_call
        // check balances
        const expectedStakerBalances = initStakerBalances;
        expectedStakerBalances.zrxBalance = initStakerBalances.zrxBalance.minus(amount);
        expectedStakerBalances.stakeBalanceInVault = initStakerBalances.stakeBalanceInVault.plus(amount);
        expectedStakerBalances.activeStakeBalance.current = initStakerBalances.activeStakeBalance.current.plus(amount);
        expectedStakerBalances.activeStakeBalance.next = initStakerBalances.activeStakeBalance.next.plus(amount);
        await this.assertBalancesAsync(expectedStakerBalances);
        // check zrx balance of vault
        const finalZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVaultAsync();
        expect(finalZrxBalanceOfVault).to.be.bignumber.equal(initZrxBalanceOfVault.plus(amount));
    }

    public async unstakeAsync(amount: BigNumber, revertError?: RevertError): Promise<void> {
        const initZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVaultAsync();
        const initStakerBalances = await this.getBalancesAsync();
        // deposit stake
        const txReceiptPromise = this._stakingWrapper.unstakeAsync(this._owner, amount);
        if (revertError !== undefined) {
            await expect(txReceiptPromise).to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // @TODO check receipt logs and return value via eth_call
        // check balances
        const expectedStakerBalances = initStakerBalances;
        expectedStakerBalances.zrxBalance = initStakerBalances.zrxBalance.plus(amount);
        expectedStakerBalances.stakeBalanceInVault = initStakerBalances.stakeBalanceInVault.minus(amount);
        expectedStakerBalances.inactiveStakeBalance.next = initStakerBalances.inactiveStakeBalance.next.minus(amount);
        expectedStakerBalances.inactiveStakeBalance.current = initStakerBalances.inactiveStakeBalance.current.minus(amount);
        expectedStakerBalances.withdrawableStakeBalance = initStakerBalances.withdrawableStakeBalance.minus(amount);
        await this.assertBalancesAsync(expectedStakerBalances);
        // check zrx balance of vault
        const finalZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVaultAsync();
        expect(finalZrxBalanceOfVault).to.be.bignumber.equal(initZrxBalanceOfVault.minus(amount));
    }

    public async moveStakeAsync(from: StakeStateInfo, to: StakeStateInfo, amount: BigNumber, revertError?: RevertError): Promise<void> {
        // check if we're moving stake into a new pool
        if (to.state == StakeState.DELEGATED && to.poolId !== undefined && !_.includes(this.poolIds, to.poolId)) {
            this.poolIds.push(to.poolId);
        }
        // cache balances
        const initZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVaultAsync();
        const initStakerBalances = await this.getBalancesAsync();
        // @TODO check receipt logs and return value via eth_call
        // set pool balances in cast
        let initFromPoolBalances = {};
        let finalFromPoolBalances = {};
        let initToPoolBalances = {};
        let finalToPoolBalances = {};
        // check balances
        const expectedStakerBalances = initStakerBalances;
        // from
        if (from.state == StakeState.ACTIVE) {
            expectedStakerBalances.activeStakeBalance.next = initStakerBalances.activeStakeBalance.next.minus(amount);
        } else if (from.state == StakeState.INACTIVE) {
            expectedStakerBalances.inactiveStakeBalance.next = initStakerBalances.inactiveStakeBalance.next.minus(amount);
            if (expectedStakerBalances.inactiveStakeBalance.next.isLessThan(expectedStakerBalances.withdrawableStakeBalance)) {
                expectedStakerBalances.withdrawableStakeBalance = expectedStakerBalances.inactiveStakeBalance.next ;
            }
        } else if (from.state == StakeState.DELEGATED && from.poolId !== undefined) {
            expectedStakerBalances.delegatedStakeBalance.next = initStakerBalances.delegatedStakeBalance.next.minus(amount);
            expectedStakerBalances.delegatedStakeByPool[from.poolId].next = initStakerBalances.delegatedStakeByPool[from.poolId].next.minus(amount);
            expectedStakerBalances.totalDelegatedStakeByPool[from.poolId].next = initStakerBalances.totalDelegatedStakeByPool[from.poolId].next.minus(amount);
        }
        // to
        if (to.state == StakeState.ACTIVE) {
            expectedStakerBalances.activeStakeBalance.next = initStakerBalances.activeStakeBalance.next.plus(amount);
        } else if (to.state == StakeState.INACTIVE) {
            expectedStakerBalances.inactiveStakeBalance.next = initStakerBalances.inactiveStakeBalance.next.plus(amount);
        } else if (to.state == StakeState.DELEGATED && to.poolId !== undefined) {
            expectedStakerBalances.delegatedStakeBalance.next = initStakerBalances.delegatedStakeBalance.next.plus(amount);
            expectedStakerBalances.delegatedStakeByPool[to.poolId].next = initStakerBalances.delegatedStakeByPool[to.poolId].next.plus(amount);
            expectedStakerBalances.totalDelegatedStakeByPool[to.poolId].next = initStakerBalances.totalDelegatedStakeByPool[to.poolId].next.plus(amount);
        }
        // move stake
        const txReceiptPromise = this._stakingWrapper.moveStakeAsync(this._owner, from, to, amount);
        if (revertError !== undefined) {
            await expect(txReceiptPromise).to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // check balances
        await this.assertBalancesAsync(expectedStakerBalances);
        // check zrx balance of vault
        const finalZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVaultAsync();
        expect(finalZrxBalanceOfVault).to.be.bignumber.equal(initZrxBalanceOfVault);
    }

    public async goToNextEpochAsync(): Promise<void> {
        // cache balances
        const initZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVaultAsync();
        const initStakerBalances = await this.getBalancesAsync();
        // go to next epoch
        await this._stakingWrapper.skipToNextEpochAsync();
        // check balances
        const expectedStakerBalances = this.getNextEpochBalances(initStakerBalances);
        await this.assertBalancesAsync(expectedStakerBalances);
       // check zrx balance of vault
       const finalZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVaultAsync();
       expect(finalZrxBalanceOfVault).to.be.bignumber.equal(initZrxBalanceOfVault);
    }

    public getNextEpochBalances(balances: StakeBalances): StakeBalances {
        let nextBalances = _.cloneDeep(balances);
        nextBalances.withdrawableStakeBalance = nextBalances.inactiveStakeBalance.current <= nextBalances.inactiveStakeBalance.next ? nextBalances.inactiveStakeBalance.current : nextBalances.inactiveStakeBalance.next;
        nextBalances.activeStakeBalance.current = nextBalances.activeStakeBalance.next;
        nextBalances.inactiveStakeBalance.current = nextBalances.inactiveStakeBalance.next;
        nextBalances.delegatedStakeBalance.current = nextBalances.delegatedStakeBalance.next;
        for (const poolId of this.poolIds) {
            nextBalances.delegatedStakeByPool[poolId].current = nextBalances.delegatedStakeByPool[poolId].next;
            nextBalances.totalDelegatedStakeByPool[poolId].current = nextBalances.totalDelegatedStakeByPool[poolId].next;
        }
        return nextBalances;
    }
    public async getBalancesAsync(): Promise<StakeBalances> {
        let stakerBalances = {
            zrxBalance: await this._stakingWrapper.getZrxTokenBalanceAsync(this._owner),
            stakeBalance: await this._stakingWrapper.getTotalStakeAsync(this._owner),
            stakeBalanceInVault: await this._stakingWrapper.getZrxVaultBalanceAsync(this._owner),
            withdrawableStakeBalance: await this._stakingWrapper.getWithdrawableStakeAsync(this._owner),
            activeStakeBalance: await this._stakingWrapper.getActiveStakeAsync(this._owner),
            inactiveStakeBalance: await this._stakingWrapper.getInactiveStakeAsync(this._owner),
            delegatedStakeBalance: await this._stakingWrapper.getStakeDelegatedByOwnerAsync(this._owner),
            delegatedStakeByPool: {} as StakeBalanceByPool,
            totalDelegatedStakeByPool: {} as StakeBalanceByPool,
        };
        // lookup for each pool
        for (const poolId of this.poolIds) {
            const delegatedStakeBalanceByPool = await this._stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolId, this._owner);
            const totalDelegatedStakeBalanceByPool = await this._stakingWrapper.getTotalStakeDelegatedToPoolAsync(poolId);
            stakerBalances.delegatedStakeByPool[poolId] = delegatedStakeBalanceByPool;
            stakerBalances.totalDelegatedStakeByPool[poolId] = totalDelegatedStakeBalanceByPool;
        }
        return stakerBalances;
    }
    public async assertBalancesAsync(expectedBalances: StakeBalances): Promise<void> {
        const balances = await this.getBalancesAsync();
        expect(balances.zrxBalance, 'zrx balance').to.be.bignumber.equal(expectedBalances.zrxBalance);
        expect(balances.stakeBalanceInVault, 'stake balance, recorded in vault').to.be.bignumber.equal(
            expectedBalances.stakeBalanceInVault,
        );
        expect(balances.withdrawableStakeBalance, 'withdrawable stake balance').to.be.bignumber.equal(
            expectedBalances.withdrawableStakeBalance,
        );
        expect(balances.activeStakeBalance.current, 'active stake balance (current)').to.be.bignumber.equal(
            expectedBalances.activeStakeBalance.current,
        );
        expect(balances.activeStakeBalance.next, 'active stake balance (next)').to.be.bignumber.equal(
            expectedBalances.activeStakeBalance.next,
        );
        expect(balances.inactiveStakeBalance.current, 'inactive stake balance (current)').to.be.bignumber.equal(
            expectedBalances.inactiveStakeBalance.current,
        );
        expect(balances.inactiveStakeBalance.next, 'inactive stake balance (next)').to.be.bignumber.equal(
            expectedBalances.inactiveStakeBalance.next,
        );
        expect(balances.delegatedStakeBalance.current, 'delegated stake balance (current)').to.be.bignumber.equal(
            expectedBalances.delegatedStakeBalance.current,
        );
        expect(balances.delegatedStakeBalance.next, 'delegated stake balance (next)').to.be.bignumber.equal(
            expectedBalances.delegatedStakeBalance.next,
        );
        expect(balances.delegatedStakeByPool, 'delegated stake by pool').to.be.deep.equal(
            expectedBalances.delegatedStakeByPool,
        );
        expect(balances.totalDelegatedStakeByPool, 'total delegated stake by pool').to.be.deep.equal(
            expectedBalances.totalDelegatedStakeByPool,
        );
    }
    public async forceBalanceSyncAsync(): Promise<void> {
        const initBalances = await this.getBalancesAsync();
        await this._stakingWrapper.stakeAsync(this._owner, new BigNumber(0));
        await this.assertBalancesAsync(initBalances);
    }
}
