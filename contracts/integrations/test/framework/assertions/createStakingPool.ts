import { StakingPool, StakingPoolById } from '@0x/contracts-staking';
import { expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TxData } from 'ethereum-types';

import { DeploymentManager } from '../deployment_manager';

import { FunctionAssertion, FunctionResult } from './function_assertion';

// tslint:disable:no-unnecessary-type-assertion

/**
 * Returns a FunctionAssertion for `createStakingPool` which assumes valid input is provided. The
 * FunctionAssertion checks that the new poolId is one more than the last poolId.
 */
/* tslint:disable:no-non-null-assertion */
export function validCreateStakingPoolAssertion(
    deployment: DeploymentManager,
    pools: StakingPoolById,
): FunctionAssertion<[number, boolean], string, string> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion<[number, boolean], string, string>(stakingWrapper, 'createStakingPool', {
        // Returns the expected ID of th created pool
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
            const [operatorShare] = args;

            // Checks the logs for the new poolId, verifies that it is as expected
            const log = result.receipt!.logs[0];
            const actualPoolId = (log as any).args.poolId;
            expect(actualPoolId).to.equal(expectedPoolId);

            // Adds the new pool to local state
            pools[actualPoolId] = new StakingPool(txData.from!, operatorShare);
        },
    });
}
/* tslint:enable:no-non-null-assertion*/
