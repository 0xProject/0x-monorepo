import { StakingPoolById, StoredBalance } from '@0x/contracts-staking';
import { expect } from '@0x/contracts-test-utils';
import { BigNumber, logUtils } from '@0x/utils';
import { TxData } from 'ethereum-types';

import { FunctionAssertion, FunctionResult } from '../../src/function_assertions';
import { DeploymentManager } from '../deployment_manager';

// tslint:disable:no-unnecessary-type-assertion

/**
 * Returns a FunctionAssertion for `createStakingPool` which assumes valid input is provided. The
 * FunctionAssertion checks that the new poolId is one more than the last poolId.
 */
export function validCreateStakingPoolAssertion(
    deployment: DeploymentManager,
    pools: StakingPoolById,
): FunctionAssertion<string, string> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion(stakingWrapper.createStakingPool, {
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
            operatorShare: number,
            addOperatorAsMaker: boolean,
            txData: Partial<TxData>,
        ) => {
            logUtils.log(`createStakingPool(${operatorShare}, ${addOperatorAsMaker}) => ${expectedPoolId}`);

            // Checks the logs for the new poolId, verifies that it is as expected
            const log = result.receipt!.logs[0]; // tslint:disable-line:no-non-null-assertion
            const actualPoolId = (log as any).args.poolId;
            expect(actualPoolId).to.equal(expectedPoolId);

            // Adds the new pool to local state
            pools[actualPoolId] = {
                operator: txData.from as string,
                operatorShare,
                delegatedStake: new StoredBalance(),
            };
        },
    });
}
