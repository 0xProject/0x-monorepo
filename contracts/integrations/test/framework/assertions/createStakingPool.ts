import { StakingRevertErrors, StoredBalance } from '@0x/contracts-staking';
import { expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TxData } from 'ethereum-types';

import { DeploymentManager } from '../deployment_manager';
import { SimulationEnvironment } from '../simulation';

import { FunctionAssertion, FunctionResult } from './function_assertion';

// tslint:disable:no-unnecessary-type-assertion

/**
 * Returns a FunctionAssertion for `createStakingPool` which assumes valid input is provided. The
 * FunctionAssertion checks that the new poolId is one more than the last poolId.
 */
/* tslint:disable:no-non-null-assertion */
export function validCreateStakingPoolAssertion(
    deployment: DeploymentManager,
    simulationEnvironment: SimulationEnvironment,
): FunctionAssertion<[number, boolean], string, string> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion<[number, boolean], string, string>(stakingWrapper, 'createStakingPool', {
        // Returns the expected ID of the created pool
        before: async () => {
            const lastPoolId = await stakingWrapper.lastPoolId().callAsync();
            // Effectively the last poolId + 1, but as a bytestring
            return `0x${new BigNumber(lastPoolId)
                .plus(1)
                .toString(16)
                .padStart(64, '0')}`;
        },
        after: async (
            expectedPoolId: string,
            result: FunctionResult,
            args: [number, boolean],
            txData: Partial<TxData>,
        ) => {
            // Ensure that the tx succeeded.
            expect(result.success, `Error: ${result.data}`).to.be.true();

            const [operatorShare] = args;

            // Checks the logs for the new poolId, verifies that it is as expected
            const log = result.receipt!.logs[0];
            const actualPoolId = (log as any).args.poolId;
            expect(actualPoolId).to.equal(expectedPoolId);

            // Adds the new pool to local state
            simulationEnvironment.stakingPools[actualPoolId] = {
                operator: txData.from!,
                operatorShare,
                delegatedStake: new StoredBalance(),
                lastFinalized: simulationEnvironment.currentEpoch,
            };
        },
    });
}

/**
 * Returns a FunctionAssertion for `createStakingPool` which assumes an invalid operator share (i.e.
 * greater than 1,000,000) is provided. The FunctionAssertion checks that the transaction reverts
 * with the expected OperatorShareError.
 */
export function invalidCreateStakingPoolAssertion(
    deployment: DeploymentManager,
): FunctionAssertion<[number, boolean], string, string> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion<[number, boolean], string, string>(stakingWrapper, 'createStakingPool', {
        // Returns the poolId we are expecting to revert with
        before: async () => {
            const lastPoolId = await stakingWrapper.lastPoolId().callAsync();
            // Effectively the last poolId + 1, but as a bytestring
            return `0x${new BigNumber(lastPoolId)
                .plus(1)
                .toString(16)
                .padStart(64, '0')}`;
        },
        after: async (expectedPoolId: string, result: FunctionResult, args: [number, boolean]) => {
            // Ensure that the tx reverted.
            expect(result.success).to.be.false();

            // Check revert error
            const [operatorShare] = args;
            expect(result.data).to.equal(
                new StakingRevertErrors.OperatorShareError(
                    StakingRevertErrors.OperatorShareErrorCodes.OperatorShareTooLarge,
                    expectedPoolId,
                    operatorShare,
                ),
            );
        },
    });
}
/* tslint:enable:no-non-null-assertion*/
