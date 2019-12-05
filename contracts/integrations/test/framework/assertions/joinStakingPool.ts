import { StakingEvents, StakingMakerStakingPoolSetEventArgs } from '@0x/contracts-staking';
import { expect, filterLogsToArguments } from '@0x/contracts-test-utils';
import { TxData } from 'ethereum-types';

import { DeploymentManager } from '../deployment_manager';

import { FunctionAssertion, FunctionResult } from './function_assertion';

/**
 * Returns a function assertion that verifies valid pool joining.
 */
/* tslint:disable:no-unnecessary-type-assertion */
/* tslint:disable:no-non-null-assertion */
export function validJoinStakingPoolAssertion(deployment: DeploymentManager): FunctionAssertion<[string], {}, void> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion<[string], {}, void>(stakingWrapper, 'joinStakingPoolAsMaker', {
        after: async (_beforeInfo, result: FunctionResult, args: [string], txData: Partial<TxData>) => {
            // Ensure that the tx succeeded.
            expect(result.success, `Error: ${result.data}`).to.be.true();

            const [poolId] = args;

            const logs = result.receipt!.logs;
            const logArgs = filterLogsToArguments<StakingMakerStakingPoolSetEventArgs>(
                logs,
                StakingEvents.MakerStakingPoolSet,
            );
            expect(logArgs).to.be.deep.eq([
                {
                    makerAddress: txData.from!,
                    poolId,
                },
            ]);
            const joinedPoolId = await deployment.staking.stakingWrapper.poolIdByMaker(txData.from!).callAsync();
            expect(joinedPoolId).to.be.eq(poolId);
        },
    });
}
/* tslint:enable:no-non-null-assertion */
/* tslint:enable:no-unnecessary-type-assertion */
