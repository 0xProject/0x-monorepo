import {
    GlobalStakeByStatus,
    OwnerStakeByStatus,
    StakeInfo,
    StakeStatus,
    StakingPoolById,
    StoredBalance,
} from '@0x/contracts-staking';
import { constants, expect } from '@0x/contracts-test-utils';
import { BigNumber, logUtils } from '@0x/utils';
import { TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { DeploymentManager } from '../utils/deployment_manager';
import { FunctionAssertion } from '../utils/function_assertions';

function incrementNextEpochBalance(stakeBalance: StoredBalance, amount: BigNumber): void {
    _.update(stakeBalance, ['nextEpochBalance'], balance => (balance || constants.ZERO_AMOUNT).plus(amount));
}

function decrementNextEpochBalance(stakeBalance: StoredBalance, amount: BigNumber): void {
    _.update(stakeBalance, ['nextEpochBalance'], balance => (balance || constants.ZERO_AMOUNT).minus(amount));
}

function updateNextEpochBalances(
    globalStake: GlobalStakeByStatus,
    ownerStake: OwnerStakeByStatus,
    pools: StakingPoolById,
    from: StakeInfo,
    to: StakeInfo,
    amount: BigNumber,
): string[] {
    // The on-chain state of these updated pools will be verified in the `after` of the assertion.
    const updatedPools = [];

    // Decrement next epoch balances associated with the `from` stake
    if (from.status === StakeStatus.Undelegated) {
        // Decrement owner undelegated stake
        decrementNextEpochBalance(ownerStake[StakeStatus.Undelegated], amount);
        // Decrement global undelegated stake
        decrementNextEpochBalance(globalStake[StakeStatus.Undelegated], amount);
    } else if (from.status === StakeStatus.Delegated) {
        // Decrement owner's delegated stake to this pool
        decrementNextEpochBalance(ownerStake[StakeStatus.Delegated][from.poolId], amount);
        // Decrement owner's total delegated stake
        decrementNextEpochBalance(ownerStake[StakeStatus.Delegated].total, amount);
        // Decrement global delegated stake
        decrementNextEpochBalance(globalStake[StakeStatus.Delegated], amount);
        // Decrement pool's delegated stake
        decrementNextEpochBalance(pools[from.poolId].delegatedStake, amount);
        updatedPools.push(from.poolId);
    }

    // Increment next epoch balances associated with the `to` stake
    if (to.status === StakeStatus.Undelegated) {
        incrementNextEpochBalance(ownerStake[StakeStatus.Undelegated], amount);
        incrementNextEpochBalance(globalStake[StakeStatus.Undelegated], amount);
    } else if (to.status === StakeStatus.Delegated) {
        // Initializes the balance for this pool if the user has not previously delegated to it
        _.defaults(ownerStake[StakeStatus.Delegated], {
            [to.poolId]: new StoredBalance(),
        });
        // Increment owner's delegated stake to this pool
        incrementNextEpochBalance(ownerStake[StakeStatus.Delegated][to.poolId], amount);
        // Increment owner's total delegated stake
        incrementNextEpochBalance(ownerStake[StakeStatus.Delegated].total, amount);
        // Increment global delegated stake
        incrementNextEpochBalance(globalStake[StakeStatus.Delegated], amount);
        // Increment pool's delegated stake
        incrementNextEpochBalance(pools[to.poolId].delegatedStake, amount);
        updatedPools.push(to.poolId);
    }
    return updatedPools;
}
/**
 * Returns a FunctionAssertion for `moveStake` which assumes valid input is provided. The
 * FunctionAssertion checks that the staker's
 */
export function validMoveStakeAssertion(
    deployment: DeploymentManager,
    globalStake: GlobalStakeByStatus,
    ownerStake: OwnerStakeByStatus,
    pools: StakingPoolById,
): FunctionAssertion<{}> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion<{}>(stakingWrapper.moveStake, {
        after: async (
            _beforeInfo,
            _result,
            from: StakeInfo,
            to: StakeInfo,
            amount: BigNumber,
            txData: Partial<TxData>,
        ) => {
            logUtils.log(
                `moveStake({status: ${StakeStatus[from.status]}, poolId: ${from.poolId} }, { status: ${
                    StakeStatus[to.status]
                }, poolId: ${to.poolId} }, ${amount})`,
            );

            const owner = txData.from as string;

            // Update local balances to match the expected result of this `moveStake` operation
            const updatedPools = updateNextEpochBalances(globalStake, ownerStake, pools, from, to, amount);

            // Fetches on-chain owner stake balances and checks against local balances
            const ownerUndelegatedStake = {
                ...new StoredBalance(),
                ...(await stakingWrapper.getOwnerStakeByStatus.callAsync(owner, StakeStatus.Undelegated)),
            };
            const ownerDelegatedStake = {
                ...new StoredBalance(),
                ...(await stakingWrapper.getOwnerStakeByStatus.callAsync(owner, StakeStatus.Delegated)),
            };
            expect(ownerUndelegatedStake).to.deep.equal(ownerStake[StakeStatus.Undelegated]);
            expect(ownerDelegatedStake).to.deep.equal(ownerStake[StakeStatus.Delegated].total);

            // Fetches on-chain global stake balances and checks against local balances
            const globalUndelegatedStake = await stakingWrapper.getGlobalStakeByStatus.callAsync(
                StakeStatus.Undelegated,
            );
            const globalDelegatedStake = await stakingWrapper.getGlobalStakeByStatus.callAsync(StakeStatus.Delegated);
            expect(globalUndelegatedStake).to.deep.equal(globalStake[StakeStatus.Undelegated]);
            expect(globalDelegatedStake).to.deep.equal(globalStake[StakeStatus.Delegated]);

            // Fetches on-chain pool stake balances and checks against local balances
            for (const poolId of updatedPools) {
                const stakeDelegatedByOwner = await stakingWrapper.getStakeDelegatedToPoolByOwner.callAsync(
                    owner,
                    poolId,
                );
                const totalStakeDelegated = await stakingWrapper.getTotalStakeDelegatedToPool.callAsync(poolId);
                expect(stakeDelegatedByOwner).to.deep.equal(ownerStake[StakeStatus.Delegated][poolId]);
                expect(totalStakeDelegated).to.deep.equal(pools[poolId].delegatedStake);
            }
        },
    });
}
