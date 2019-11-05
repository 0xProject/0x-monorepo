import { expect } from '@0x/contracts-test-utils';

import { DeploymentManager } from '../utils/deployment_manager';
import { FunctionAssertion, FunctionResult } from '../utils/function_assertions';

export function validDecreaseStakingPoolOperatorShareAssertion(
    deployment: DeploymentManager,
    context?: any,
): FunctionAssertion<{}> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion(stakingWrapper.decreaseStakingPoolOperatorShare, {
        after: async (_beforeInfo, _result: FunctionResult, poolId: string, expectedOperatorShare: number) => {
            const { operatorShare } = await stakingWrapper.getStakingPool.callAsync(poolId);
            expect(operatorShare).to.bignumber.equal(expectedOperatorShare);
            console.log(`decreaseStakingPoolOperatorShare(${poolId}, ${expectedOperatorShare})`);
            if (context !== undefined) {
                context.operatorShares[poolId] = operatorShare;
            }
        },
    });
}
