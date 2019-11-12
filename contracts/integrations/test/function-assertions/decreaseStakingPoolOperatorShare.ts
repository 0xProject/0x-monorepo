import { StakingPoolById } from '@0x/contracts-staking';
import { expect } from '@0x/contracts-test-utils';
import { logUtils } from '@0x/utils';

import { FunctionAssertion, FunctionResult } from '../../src/function_assertions';
import { DeploymentManager } from '../deployment_manager';

/**
 * Returns a FunctionAssertion for `decreaseStakingPoolOperatorShare` which assumes valid input is
 * provided. The FunctionAssertion checks that the operator share actually gets updated.
 */
export function validDecreaseStakingPoolOperatorShareAssertion(
    deployment: DeploymentManager,
    pools: StakingPoolById,
): FunctionAssertion<{}> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion<{}>(stakingWrapper.decreaseStakingPoolOperatorShare, {
        after: async (_beforeInfo, _result: FunctionResult, poolId: string, expectedOperatorShare: number) => {
            logUtils.log(`decreaseStakingPoolOperatorShare(${poolId}, ${expectedOperatorShare})`);

            // Checks that the on-chain pool's operator share has been updated.
            const { operatorShare } = await stakingWrapper.getStakingPool.callAsync(poolId);
            expect(operatorShare).to.bignumber.equal(expectedOperatorShare);
            // Updates the pool in local state.
            pools[poolId].operatorShare = operatorShare;
        },
    });
}
