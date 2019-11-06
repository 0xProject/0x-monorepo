import { expect } from '@0x/contracts-test-utils';
import { logUtils } from '@0x/utils';

import { DeploymentManager } from '../utils/deployment_manager';
import { FunctionAssertion, FunctionResult } from '../utils/function_assertions';

/**
 * Returns a FunctionAssertion for `decreaseStakingPoolOperatorShare` which assumes valid input is
 * provided. The FunctionAssertion checks that the operator share actually gets updated.
 */
export function validDecreaseStakingPoolOperatorShareAssertion(
    deployment: DeploymentManager,
    context?: any,
): FunctionAssertion<{}> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion<{}>(stakingWrapper.decreaseStakingPoolOperatorShare, {
        after: async (_beforeInfo, _result: FunctionResult, poolId: string, expectedOperatorShare: number) => {
            const { operatorShare } = await stakingWrapper.getStakingPool.callAsync(poolId);
            expect(operatorShare).to.bignumber.equal(expectedOperatorShare);
            logUtils.log(`decreaseStakingPoolOperatorShare(${poolId}, ${expectedOperatorShare})`);
            if (context !== undefined) {
                context.operatorShares[poolId] = operatorShare;
            }
        },
    });
}
