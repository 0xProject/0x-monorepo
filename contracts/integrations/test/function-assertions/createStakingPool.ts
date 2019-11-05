import { expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { DeploymentManager } from '../utils/deployment_manager';
import { FunctionAssertion, FunctionResult } from '../utils/function_assertions';

export function validCreateStakingPoolAssertion(
    deployment: DeploymentManager,
    context?: any,
): FunctionAssertion<string> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion(stakingWrapper.createStakingPool, {
        before: async () => {
            const lastPoolId = await stakingWrapper.lastPoolId.callAsync();
            return `0x${new BigNumber(lastPoolId)
                .plus(1)
                .toString(16)
                .padStart(64, '0')}`;
        },
        after: async (
            expectedPoolId: string,
            result: FunctionResult,
            operatorShare: number,
            addOperatorAsMaker: boolean,
        ) => {
            const log = result.receipt!.logs[0];
            const actualPoolId = (log as any).args.poolId;
            expect(actualPoolId).to.equal(expectedPoolId);
            console.log(`createStakingPool(${operatorShare}, ${addOperatorAsMaker}) => ${actualPoolId}`);
            if (context !== undefined) {
                context.operatorShares[actualPoolId] = operatorShare;
            }
        },
    });
}
