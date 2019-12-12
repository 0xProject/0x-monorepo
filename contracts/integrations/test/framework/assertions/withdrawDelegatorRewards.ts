import { WETH9Events, WETH9TransferEventArgs } from '@0x/contracts-erc20';
import { loadCurrentBalance, StoredBalance } from '@0x/contracts-staking';
import { expect, filterLogsToArguments } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TxData } from 'ethereum-types';

import { DeploymentManager } from '../deployment_manager';
import { SimulationEnvironment } from '../simulation';

import { FunctionAssertion, FunctionResult } from './function_assertion';

interface WithdrawDelegatorRewardsBeforeInfo {
    delegatorStake: StoredBalance;
    poolRewards: BigNumber;
    wethReservedForPoolRewards: BigNumber;
}

/**
 * Returns a FunctionAssertion for `withdrawDelegatorRewards` which assumes valid input is provided.
 * It checks that the delegator's stake gets synced and pool rewards are updated to reflect the
 * amount withdrawn.
 */
/* tslint:disable:no-unnecessary-type-assertion */
export function validWithdrawDelegatorRewardsAssertion(
    deployment: DeploymentManager,
    simulationEnvironment: SimulationEnvironment,
): FunctionAssertion<[string], WithdrawDelegatorRewardsBeforeInfo, void> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion(stakingWrapper, 'withdrawDelegatorRewards', {
        before: async (args: [string], txData: Partial<TxData>) => {
            const [poolId] = args;

            const delegatorStake = await stakingWrapper
                .getStakeDelegatedToPoolByOwner(txData.from as string, poolId)
                .callAsync();
            const poolRewards = await stakingWrapper.rewardsByPoolId(poolId).callAsync();
            const wethReservedForPoolRewards = await stakingWrapper.wethReservedForPoolRewards().callAsync();
            return { delegatorStake, poolRewards, wethReservedForPoolRewards };
        },
        after: async (
            beforeInfo: WithdrawDelegatorRewardsBeforeInfo,
            result: FunctionResult,
            args: [string],
            txData: Partial<TxData>,
        ) => {
            // Ensure that the tx succeeded.
            expect(result.success, `Error: ${result.data}`).to.be.true();

            const [poolId] = args;
            const { currentEpoch } = simulationEnvironment;

            // Check that delegator stake has been synced
            const expectedDelegatorStake = loadCurrentBalance(beforeInfo.delegatorStake, currentEpoch);
            const delegatorStake = await stakingWrapper
                .getStakeDelegatedToPoolByOwner(txData.from as string, poolId)
                .callAsync();
            expect(delegatorStake).to.deep.equal(expectedDelegatorStake);

            // Check that pool rewards have been updated to reflect the amount withdrawn.
            const transferEvents = filterLogsToArguments<WETH9TransferEventArgs>(
                result.receipt!.logs, // tslint:disable-line:no-non-null-assertion
                WETH9Events.Transfer,
            );
            const expectedPoolRewards =
                transferEvents.length > 0
                    ? beforeInfo.poolRewards.minus(transferEvents[0]._value)
                    : beforeInfo.poolRewards;
            const poolRewards = await stakingWrapper.rewardsByPoolId(poolId).callAsync();
            expect(poolRewards).to.bignumber.equal(expectedPoolRewards);

            // TODO: Check CR
        },
    });
}
/* tslint:enable:no-unnecessary-type-assertion */
