import { StakingPoolById } from '@0x/contracts-staking';
import { expect } from '@0x/contracts-test-utils';
import { logUtils } from '@0x/utils';

import { DeploymentManager } from '../deployment_manager';

import { FunctionAssertion, FunctionResult } from './function_assertion';

/**
 * Returns a FunctionAssertion for `decreaseStakingPoolOperatorShare` which assumes valid input is
 * provided. The FunctionAssertion checks that the operator share actually gets updated.
 */
export function validDecreaseStakingPoolOperatorShareAssertion(
    deployment: DeploymentManager,
    pools: StakingPoolById,
): FunctionAssertion<{}, void> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion<{}, void>(stakingWrapper.decreaseStakingPoolOperatorShare, {
        after: async (_beforeInfo, _result: FunctionResult, poolId: string, expectedOperatorShare: number) => {
            logUtils.log(`decreaseStakingPoolOperatorShare(${poolId}, ${expectedOperatorShare})`);

            // Checks that the on-chain pool's operator share has been updated.
            const { operatorShare } = await stakingWrapper.getStakingPool(poolId).callAsync();
            expect(operatorShare).to.bignumber.equal(expectedOperatorShare);
            // Updates the pool in local state.
            pools[poolId].operatorShare = operatorShare;
        },
    });
}
