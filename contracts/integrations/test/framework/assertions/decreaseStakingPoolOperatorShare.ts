import { StakingPoolById } from '@0x/contracts-staking';
import { expect } from '@0x/contracts-test-utils';
import { TxData } from 'ethereum-types';

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

    return new FunctionAssertion<[string, number], {}, void>(stakingWrapper, 'decreaseStakingPoolOperatorShare', {
        after: async (_beforeInfo, result: FunctionResult, args: [string, number], _txData: Partial<TxData>) => {
            // Ensure that the tx succeeded.
            expect(result.success, `Error: ${result.data}`).to.be.true();

            const [poolId, expectedOperatorShare] = args;

            // Checks that the on-chain pool's operator share has been updated.
            const { operatorShare } = await stakingWrapper.getStakingPool(poolId).callAsync();
            expect(operatorShare).to.bignumber.equal(expectedOperatorShare);

            // Updates the pool in local state.
            pools[poolId].operatorShare = operatorShare;
        },
    });
}
