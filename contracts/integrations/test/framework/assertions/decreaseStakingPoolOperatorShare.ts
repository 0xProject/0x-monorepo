import { constants, StakingPoolById, StakingRevertErrors } from '@0x/contracts-staking';
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
): FunctionAssertion<[string, number], void, void> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion<[string, number], void, void>(stakingWrapper, 'decreaseStakingPoolOperatorShare', {
        after: async (_beforeInfo: void, result: FunctionResult, args: [string, number], _txData: Partial<TxData>) => {
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

/**
 * Returns a FunctionAssertion for `decreaseStakingPoolOperatorShare` which assumes the given
 * operator share is larger than the current operator share for the pool. The FunctionAssertion
 * checks that the transaction reverts with the correct error in this scenario.
 */
export function invalidDecreaseStakingPoolOperatorShareAssertion(
    deployment: DeploymentManager,
): FunctionAssertion<[string, number], void, void> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion<[string, number], void, void>(stakingWrapper, 'decreaseStakingPoolOperatorShare', {
        after: async (_beforeInfo: void, result: FunctionResult, args: [string, number], _txData: Partial<TxData>) => {
            // Ensure that the tx reverted.
            expect(result.success).to.be.false();

            // Check revert error
            const [poolId, operatorShare] = args;
            const expectedError =
                operatorShare > constants.PPM
                    ? new StakingRevertErrors.OperatorShareError(
                          StakingRevertErrors.OperatorShareErrorCodes.OperatorShareTooLarge,
                          poolId,
                          operatorShare,
                      )
                    : new StakingRevertErrors.OperatorShareError(
                          StakingRevertErrors.OperatorShareErrorCodes.CanOnlyDecreaseOperatorShare,
                          poolId,
                          operatorShare,
                      );
            expect(result.data).to.equal(expectedError);
        },
    });
}
