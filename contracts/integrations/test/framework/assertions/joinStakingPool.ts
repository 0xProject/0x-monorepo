import { StakingEvents, StakingMakerStakingPoolSetEventArgs, StakingPoolById } from '@0x/contracts-staking';
import { constants, expect, filterLogsToArguments } from '@0x/contracts-test-utils';
import { logUtils } from '@0x/utils';

import { DeploymentManager } from '../deployment_manager';

import { FunctionArguments, FunctionAssertion, FunctionResult } from './function_assertion';

export function validJoinStakingPoolAssertion(deployment: DeploymentManager): FunctionAssertion<[string], {}, void> {
    return new FunctionAssertion<[string], {}, void>(deployment.staking.stakingWrapper.joinStakingPoolAsMaker, {
        after: async (_beforeInfo, _result: FunctionResult, args: FunctionArguments<[string]>) => {
            const poolId = args.args[0];

            if (args.txData === undefined) {
                throw new Error('Undefined transaction data');
            }

            if (args.txData.from === undefined) {
                throw new Error('Undefined from address');
            }

            if (_result.receipt === undefined) {
                throw new Error('Undefined transaction receipt');
            }

            expect(_result.success).to.be.true();

            const logs = _result.receipt.logs;
            const logArgs = filterLogsToArguments<StakingMakerStakingPoolSetEventArgs>(
                logs,
                StakingEvents.MakerStakingPoolSet,
            );
            expect(logArgs).to.be.deep.eq([
                {
                    maker: args.txData.from,
                    poolId,
                },
            ]);
            const joinedPoolId = deployment.staking.stakingWrapper.poolIdByMaker(args.txData.from);
            expect(joinedPoolId).to.be.eq(poolId);

            console.log(`Pool ${poolId} joined by ${args.txData.from}`); /* tslint:disable-line:no-console */
        },
    });
}
