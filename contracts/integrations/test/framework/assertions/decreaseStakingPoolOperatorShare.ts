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
): FunctionAssertion<[string, number], {}, void> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion<[string, number], {}, void>(
        stakingWrapper.decreaseStakingPoolOperatorShare.bind(stakingWrapper),
        {
            after: async (_beforeInfo, _result: FunctionResult, args: { args: [string, number] }) => {
                const poolId = args.args[0];
                const expectedOperatorShare = args.args[1];

                logUtils.log(`decreaseStakingPoolOperatorShare(${poolId}, ${expectedOperatorShare})`);

                // Checks that the on-chain pool's operator share has been updated.
                const { operatorShare } = await stakingWrapper.getStakingPool(poolId).callAsync();
                expect(operatorShare).to.bignumber.equal(expectedOperatorShare);
                // Updates the pool in local state.
                pools[poolId].operatorShare = operatorShare;
            },
        },
    );
}
