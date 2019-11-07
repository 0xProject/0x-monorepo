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
            const updatedPools = [];
            if (from.status === StakeStatus.Undelegated) {
                decrementNextEpochBalance(ownerStake[StakeStatus.Undelegated], amount);
                decrementNextEpochBalance(globalStake[StakeStatus.Undelegated], amount);
            } else if (from.status === StakeStatus.Delegated) {
                _.defaults(ownerStake[StakeStatus.Delegated], {
                    [from.poolId]: new StoredBalance(),
                });
                decrementNextEpochBalance(ownerStake[StakeStatus.Delegated][from.poolId], amount);
                decrementNextEpochBalance(ownerStake[StakeStatus.Delegated].total, amount);
                decrementNextEpochBalance(globalStake[StakeStatus.Delegated], amount);
                decrementNextEpochBalance(pools[from.poolId].delegatedStake, amount);
                updatedPools.push(from.poolId);
            }

            if (to.status === StakeStatus.Undelegated) {
                incrementNextEpochBalance(ownerStake[StakeStatus.Undelegated], amount);
                incrementNextEpochBalance(globalStake[StakeStatus.Undelegated], amount);
            } else if (to.status === StakeStatus.Delegated) {
                _.defaults(ownerStake[StakeStatus.Delegated], {
                    [to.poolId]: new StoredBalance(),
                });
                incrementNextEpochBalance(ownerStake[StakeStatus.Delegated][to.poolId], amount);
                incrementNextEpochBalance(ownerStake[StakeStatus.Delegated].total, amount);
                incrementNextEpochBalance(globalStake[StakeStatus.Delegated], amount);
                incrementNextEpochBalance(pools[to.poolId].delegatedStake, amount);
                updatedPools.push(to.poolId);
            }

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

            const globalUndelegatedStake = await stakingWrapper.getGlobalStakeByStatus.callAsync(
                StakeStatus.Undelegated,
            );
            const globalDelegatedStake = await stakingWrapper.getGlobalStakeByStatus.callAsync(StakeStatus.Delegated);
            expect(globalUndelegatedStake).to.deep.equal(globalStake[StakeStatus.Undelegated]);
            expect(globalDelegatedStake).to.deep.equal(globalStake[StakeStatus.Delegated]);

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
