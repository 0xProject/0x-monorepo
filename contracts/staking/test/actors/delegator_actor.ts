import { chaiSetup } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber, RevertError } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { StakingWrapper } from '../utils/staking_wrapper';
import { DelegatorBalances, StakerBalances } from '../utils/types';

import { StakerActor } from './staker_actor';

chaiSetup.configure();
const expect = chai.expect;

export class DelegatorActor extends StakerActor {
    constructor(owner: string, stakingWrapper: StakingWrapper) {
        super(owner, stakingWrapper);
    }
    public async depositZrxAndDelegateToStakingPoolAsync(
        poolId: string,
        amount: BigNumber,
        revertError?: RevertError,
    ): Promise<void> {
        // query init balances
        const initZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVaultAsync();
        const initDelegatorBalances = await this.getBalancesAsync([poolId]);
        // deposit stake
        const txReceiptPromise = this._stakingWrapper.depositZrxAndDelegateToStakingPoolAsync(
            this._owner,
            poolId,
            amount,
        );
        if (revertError !== undefined) {
            await expect(txReceiptPromise).to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // @TODO check receipt logs and return value via eth_call
        // check balances
        const expectedDelegatorBalances = initDelegatorBalances;
        expectedDelegatorBalances.zrxBalance = initDelegatorBalances.zrxBalance.minus(amount);
        expectedDelegatorBalances.stakeBalance = initDelegatorBalances.stakeBalance.plus(amount);
        expectedDelegatorBalances.stakeBalanceInVault = initDelegatorBalances.stakeBalanceInVault.plus(amount);
        expectedDelegatorBalances.activatedStakeBalance = initDelegatorBalances.activatedStakeBalance.plus(amount);
        expectedDelegatorBalances.delegatedStakeBalance = initDelegatorBalances.delegatedStakeBalance.plus(amount);
        expectedDelegatorBalances.stakeDelegatedToPoolByOwner[0] = initDelegatorBalances.stakeDelegatedToPoolByOwner[0].plus(
            amount,
        );
        expectedDelegatorBalances.stakeDelegatedToPool[0] = initDelegatorBalances.stakeDelegatedToPool[0].plus(amount);
        await this.assertBalancesAsync(expectedDelegatorBalances, [poolId]);
        // check zrx balance of vault
        const finalZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVaultAsync();
        expect(finalZrxBalanceOfVault).to.be.bignumber.equal(initZrxBalanceOfVault.plus(amount));
    }
    public async activateAndDelegateStakeAsync(
        poolId: string,
        amount: BigNumber,
        revertError?: RevertError,
    ): Promise<void> {
        // query init balances
        const initDelegatorBalances = await this.getBalancesAsync([poolId]);
        // activate and delegate
        const txReceiptPromise = this._stakingWrapper.activateAndDelegateStakeAsync(this._owner, poolId, amount);
        if (revertError !== undefined) {
            await expect(txReceiptPromise).to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // @TODO check receipt logs and return value via eth_call
        // check balances
        // check balances
        const expectedDelegatorBalances = initDelegatorBalances;
        expectedDelegatorBalances.activatedStakeBalance = initDelegatorBalances.activatedStakeBalance.plus(amount);
        expectedDelegatorBalances.withdrawableStakeBalance = expectedDelegatorBalances.withdrawableStakeBalance.minus(
            amount,
        );
        expectedDelegatorBalances.activatableStakeBalance = expectedDelegatorBalances.activatableStakeBalance.minus(
            amount,
        );
        expectedDelegatorBalances.deactivatedStakeBalance = expectedDelegatorBalances.deactivatedStakeBalance.minus(
            amount,
        );
        expectedDelegatorBalances.delegatedStakeBalance = initDelegatorBalances.delegatedStakeBalance.plus(amount);
        expectedDelegatorBalances.stakeDelegatedToPoolByOwner[0] = initDelegatorBalances.stakeDelegatedToPoolByOwner[0].plus(
            amount,
        );
        expectedDelegatorBalances.stakeDelegatedToPool[0] = initDelegatorBalances.stakeDelegatedToPool[0].plus(amount);
        await this.assertBalancesAsync(expectedDelegatorBalances, [poolId]);
    }
    public async deactivateAndTimeLockDelegatedStakeAsync(
        poolId: string,
        amount: BigNumber,
        revertError?: RevertError,
    ): Promise<void> {
        // query init balances
        const initDelegatorBalances = await this.getBalancesAsync([poolId]);
        // deactivate and timeLock
        const txReceiptPromise = this._stakingWrapper.deactivateAndTimeLockDelegatedStakeAsync(
            this._owner,
            poolId,
            amount,
        );
        if (revertError !== undefined) {
            await expect(txReceiptPromise).to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // @TODO check receipt logs and return value via eth_call
        // check balances
        const expectedDelegatorBalances = initDelegatorBalances;
        expectedDelegatorBalances.activatedStakeBalance = initDelegatorBalances.activatedStakeBalance.minus(amount);
        expectedDelegatorBalances.timeLockedStakeBalance = expectedDelegatorBalances.timeLockedStakeBalance.plus(
            amount,
        );
        expectedDelegatorBalances.deactivatedStakeBalance = expectedDelegatorBalances.deactivatedStakeBalance.plus(
            amount,
        );
        expectedDelegatorBalances.delegatedStakeBalance = initDelegatorBalances.delegatedStakeBalance.minus(amount);
        expectedDelegatorBalances.stakeDelegatedToPoolByOwner[0] = initDelegatorBalances.stakeDelegatedToPoolByOwner[0].minus(
            amount,
        );
        expectedDelegatorBalances.stakeDelegatedToPool[0] = initDelegatorBalances.stakeDelegatedToPool[0].minus(amount);
        await this.assertBalancesAsync(expectedDelegatorBalances, [poolId]);
    }
    public async getBalancesAsync(maybePoolIds?: string[]): Promise<DelegatorBalances> {
        const stakerBalances = await super.getBalancesAsync();
        const delegatorBalances = {
            ...stakerBalances,
            delegatedStakeBalance: await this._stakingWrapper.getStakeDelegatedByOwnerAsync(this._owner),
            stakeDelegatedToPoolByOwner: Array(),
            stakeDelegatedToPool: Array(),
        };
        const poolIds = maybePoolIds !== undefined ? maybePoolIds : [];
        for (const poolId of poolIds) {
            const stakeDelegatedToPoolByOwner = await this._stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(
                poolId,
                this._owner,
            );
            delegatorBalances.stakeDelegatedToPoolByOwner.push(stakeDelegatedToPoolByOwner);
            const stakeDelegatedToPool = await this._stakingWrapper.getTotalStakeDelegatedToPoolAsync(poolId);
            delegatorBalances.stakeDelegatedToPool.push(stakeDelegatedToPool);
        }
        return delegatorBalances;
    }
    public async assertBalancesAsync(expectedBalances: DelegatorBalances, maybePoolIds?: string[]): Promise<void> {
        await super.assertBalancesAsync(expectedBalances);
        const balances = await this.getBalancesAsync(maybePoolIds);
        expect(balances.delegatedStakeBalance, 'delegated stake balance').to.be.bignumber.equal(
            expectedBalances.delegatedStakeBalance,
        );
        const poolIds = maybePoolIds !== undefined ? maybePoolIds : [];
        for (let i = 0; i < poolIds.length; i++) {
            expect(
                balances.stakeDelegatedToPoolByOwner[i],
                `stake delegated to pool ${poolIds[i]} by owner`,
            ).to.be.bignumber.equal(expectedBalances.stakeDelegatedToPoolByOwner[i]);
            expect(
                balances.stakeDelegatedToPool[i],
                `total stake delegated to pool ${poolIds[i]}`,
            ).to.be.bignumber.equal(expectedBalances.stakeDelegatedToPool[i]);
        }
    }
}
