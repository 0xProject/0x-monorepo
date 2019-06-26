import {
    chaiSetup,
    constants,
    expectTransactionFailedAsync,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils'
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { StakingWrapper } from '../utils/staking_wrapper';
import { DelegatorBalances, StakerBalances } from '../utils/types';

import { StakerActor } from './StakerActor';

const expect = chai.expect;

export class DelegatorActor extends StakerActor {

    constructor(owner: string, stakingWrapper: StakingWrapper) {
        super(owner, stakingWrapper);
    }

    public async depositAndDelegateAsync(poolId: string, amount: BigNumber, revertReason?: RevertReason): Promise<void> {
        const txReceiptPromise = this._stakingWrapper.depositAndDelegateAsync(this._owner, poolId, amount);
        if (revertReason !== undefined) {
            await expectTransactionFailedAsync(
                txReceiptPromise,
                revertReason
            );
            return;
        }
        const txReceipt = await txReceiptPromise;
    }
    public async activateAndDelegateStakeAsync(poolId: string, amount: BigNumber, revertReason?: RevertReason): Promise<void> {
        const txReceiptPromise = this._stakingWrapper.activateAndDelegateStakeAsync(this._owner, poolId, amount);
        if (revertReason !== undefined) {
            await expectTransactionFailedAsync(
                txReceiptPromise,
                revertReason
            );
            return;
        }
        const txReceipt = await txReceiptPromise;
    }
    public async deactivateAndTimelockDelegatedStakeAsync(poolId: string, amount: BigNumber, revertReason?: RevertReason): Promise<void> {
        const txReceiptPromise = this._stakingWrapper.deactivateAndTimelockDelegatedStakeAsync(this._owner, poolId, amount);
        if (revertReason !== undefined) {
            await expectTransactionFailedAsync(
                txReceiptPromise,
                revertReason
            );
            return;
        }
        const txReceipt = await txReceiptPromise;
    }
    public async getBalancesAsync(maybePoolIds?: string[]): Promise<DelegatorBalances> {
        const stakerBalances = await super.getBalancesAsync();
        let delegatorBalances = {
            ...stakerBalances,
            delegatedStakeBalance: await this._stakingWrapper.getStakeDelegatedByOwnerAsync(this._owner),
            stakeDelegatedToPoolByOwner: Array(),
            stakeDelegatedToPool: Array(),
        };
        const poolIds = maybePoolIds !== undefined ? maybePoolIds : [];
        for (const poolId of poolIds) {
            const stakeDelegatedToPoolByOwner = await this._stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolId, this._owner);
            delegatorBalances.stakeDelegatedToPoolByOwner.push(stakeDelegatedToPoolByOwner);
            const stakeDelegatedToPool = await this._stakingWrapper.getStakeDelegatedToPoolAsync(poolId);
            delegatorBalances.stakeDelegatedToPool.push(stakeDelegatedToPool);
        }
        return delegatorBalances;
    }
    public async assertBalancesAsync(expectedBalances: DelegatorBalances, maybePoolIds?: string[]): Promise<void> {
        await super.assertBalancesAsync(expectedBalances);
        const balances = await this.getBalancesAsync();
        expect(balances.delegatedStakeBalance, 'delegated stake balance').to.be.bignumber.equal(expectedBalances.delegatedStakeBalance);
        const poolIds = maybePoolIds !== undefined ? maybePoolIds : [];
        for (const i in poolIds) {
            expect(balances.stakeDelegatedToPoolByOwner[i], `stake delegated to pool ${poolIds[i]} by owner`).to.be.bignumber.equal(expectedBalances.stakeDelegatedToPoolByOwner[i]);
            expect(balances.stakeDelegatedToPool[i], `total stake delegated to pool ${poolIds[i]}`).to.be.bignumber.equal(expectedBalances.stakeDelegatedToPool[i]);
        }
    }
}