import {
    decreaseNextBalance,
    increaseNextBalance,
    loadCurrentBalance,
    OwnerStakeByStatus,
    StakeInfo,
    StakeStatus,
    StoredBalance,
} from '@0x/contracts-staking';
import { expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { DeploymentManager } from '../deployment_manager';
import { SimulationEnvironment } from '../simulation';

import { FunctionAssertion, FunctionResult } from './function_assertion';

function updateNextEpochBalances(
    ownerStake: OwnerStakeByStatus,
    from: StakeInfo,
    to: StakeInfo,
    amount: BigNumber,
    simulationEnvironment: SimulationEnvironment,
): string[] {
    const { globalStake, stakingPools, currentEpoch } = simulationEnvironment;

    // The on-chain state of these updated pools will be verified in the `after` of the assertion.
    const updatedPools = [];

    // Decrement next epoch balances associated with the `from` stake
    if (from.status === StakeStatus.Undelegated) {
        // Decrement owner undelegated stake
        ownerStake[StakeStatus.Undelegated] = decreaseNextBalance(
            ownerStake[StakeStatus.Undelegated],
            amount,
            currentEpoch,
        );
        // Decrement global undelegated stake
        globalStake[StakeStatus.Undelegated] = decreaseNextBalance(
            globalStake[StakeStatus.Undelegated],
            amount,
            currentEpoch,
        );
    } else if (from.status === StakeStatus.Delegated) {
        // Decrement owner's delegated stake to this pool
        ownerStake[StakeStatus.Delegated][from.poolId] = decreaseNextBalance(
            ownerStake[StakeStatus.Delegated][from.poolId],
            amount,
            currentEpoch,
        );
        // Decrement owner's total delegated stake
        ownerStake[StakeStatus.Delegated].total = decreaseNextBalance(
            ownerStake[StakeStatus.Delegated].total,
            amount,
            currentEpoch,
        );
        // Decrement global delegated stake
        globalStake[StakeStatus.Delegated] = decreaseNextBalance(
            globalStake[StakeStatus.Delegated],
            amount,
            currentEpoch,
        );
        // Decrement pool's delegated stake
        stakingPools[from.poolId].delegatedStake = decreaseNextBalance(
            stakingPools[from.poolId].delegatedStake,
            amount,
            currentEpoch,
        );
        updatedPools.push(from.poolId);

        // TODO: Check that delegator rewards have been withdrawn/synced
    }

    // Increment next epoch balances associated with the `to` stake
    if (to.status === StakeStatus.Undelegated) {
        // Increment owner undelegated stake
        ownerStake[StakeStatus.Undelegated] = increaseNextBalance(
            ownerStake[StakeStatus.Undelegated],
            amount,
            currentEpoch,
        );
        // Increment global undelegated stake
        globalStake[StakeStatus.Undelegated] = increaseNextBalance(
            globalStake[StakeStatus.Undelegated],
            amount,
            currentEpoch,
        );
    } else if (to.status === StakeStatus.Delegated) {
        // Initializes the balance for this pool if the user has not previously delegated to it
        _.defaults(ownerStake[StakeStatus.Delegated], {
            [to.poolId]: new StoredBalance(),
        });
        // Increment owner's delegated stake to this pool
        ownerStake[StakeStatus.Delegated][to.poolId] = increaseNextBalance(
            ownerStake[StakeStatus.Delegated][to.poolId],
            amount,
            currentEpoch,
        );
        // Increment owner's total delegated stake
        ownerStake[StakeStatus.Delegated].total = increaseNextBalance(
            ownerStake[StakeStatus.Delegated].total,
            amount,
            currentEpoch,
        );
        // Increment global delegated stake
        globalStake[StakeStatus.Delegated] = increaseNextBalance(
            globalStake[StakeStatus.Delegated],
            amount,
            currentEpoch,
        );
        // Increment pool's delegated stake
        stakingPools[to.poolId].delegatedStake = increaseNextBalance(
            stakingPools[to.poolId].delegatedStake,
            amount,
            currentEpoch,
        );
        updatedPools.push(to.poolId);

        // TODO: Check that delegator rewards have been withdrawn/synced
    }
    return updatedPools;
}
/**
 * Returns a FunctionAssertion for `moveStake` which assumes valid input is provided. Checks that
 * the owner's stake and global stake by status get updated correctly.
 */
/* tslint:disable:no-unnecessary-type-assertion */
export function validMoveStakeAssertion(
    deployment: DeploymentManager,
    simulationEnvironment: SimulationEnvironment,
    ownerStake: OwnerStakeByStatus,
): FunctionAssertion<[StakeInfo, StakeInfo, BigNumber], void, void> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion<[StakeInfo, StakeInfo, BigNumber], void, void>(stakingWrapper, 'moveStake', {
        after: async (
            _beforeInfo: void,
            result: FunctionResult,
            args: [StakeInfo, StakeInfo, BigNumber],
            txData: Partial<TxData>,
        ) => {
            // Ensure that the tx succeeded.
            expect(result.success, `Error: ${result.data}`).to.be.true();

            const [from, to, amount] = args;
            const { stakingPools, globalStake, currentEpoch } = simulationEnvironment;

            const owner = txData.from!; // tslint:disable-line:no-non-null-assertion

            // Update local balances to match the expected result of this `moveStake` operation
            const updatedPools = updateNextEpochBalances(ownerStake, from, to, amount, simulationEnvironment);

            // Fetches on-chain owner stake balances and checks against local balances
            const ownerUndelegatedStake = {
                ...new StoredBalance(),
                ...(await stakingWrapper.getOwnerStakeByStatus(owner, StakeStatus.Undelegated).callAsync()),
            };
            const ownerDelegatedStake = {
                ...new StoredBalance(),
                ...(await stakingWrapper.getOwnerStakeByStatus(owner, StakeStatus.Delegated).callAsync()),
            };
            expect(ownerUndelegatedStake).to.deep.equal(
                loadCurrentBalance(ownerStake[StakeStatus.Undelegated], currentEpoch),
            );
            expect(ownerDelegatedStake).to.deep.equal(
                loadCurrentBalance(ownerStake[StakeStatus.Delegated].total, currentEpoch),
            );

            // Fetches on-chain global stake balances and checks against local balances
            const globalDelegatedStake = await stakingWrapper.getGlobalStakeByStatus(StakeStatus.Delegated).callAsync();
            const globalUndelegatedStake = await stakingWrapper
                .getGlobalStakeByStatus(StakeStatus.Undelegated)
                .callAsync();
            expect(globalDelegatedStake).to.deep.equal(
                loadCurrentBalance(globalStake[StakeStatus.Delegated], currentEpoch),
            );
            expect(globalUndelegatedStake).to.deep.equal(
                loadCurrentBalance(globalStake[StakeStatus.Undelegated], currentEpoch),
            );

            // Fetches on-chain pool stake balances and checks against local balances
            for (const poolId of updatedPools) {
                const stakeDelegatedByOwner = await stakingWrapper
                    .getStakeDelegatedToPoolByOwner(owner, poolId)
                    .callAsync();
                const totalStakeDelegated = await stakingWrapper.getTotalStakeDelegatedToPool(poolId).callAsync();
                expect(stakeDelegatedByOwner).to.deep.equal(
                    loadCurrentBalance(ownerStake[StakeStatus.Delegated][poolId], currentEpoch),
                );
                expect(totalStakeDelegated).to.deep.equal(
                    loadCurrentBalance(stakingPools[poolId].delegatedStake, currentEpoch),
                );
            }
        },
    });
}
/* tslint:enable:no-unnecessary-type-assertion */
