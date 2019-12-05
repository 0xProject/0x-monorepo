import { WETH9TransferEventArgs, WETH9Events } from '@0x/contracts-erc20';
import { StoredBalance } from '@0x/contracts-staking';
import { expect, filterLogsToArguments, verifyEventsFromLogs } from '@0x/contracts-test-utils';
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
 * Returns a FunctionAssertion for `stake` which assumes valid input is provided. The
 * FunctionAssertion checks that the staker and zrxVault's balances of ZRX decrease and increase,
 * respectively, by the input amount.
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
                .getStakeDelegatedToPoolByOwner(txData.from!, poolId)
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

            const expectedDelegatorStake = {
                ...beforeInfo.delegatorStake,
                currentEpoch: currentEpoch,
                currentEpochBalance: currentEpoch.isGreaterThan(beforeInfo.delegatorStake.currentEpoch)
                    ? beforeInfo.delegatorStake.nextEpochBalance
                    : beforeInfo.delegatorStake.currentEpochBalance,
            };
            const delegatorStake = await stakingWrapper
                .getStakeDelegatedToPoolByOwner(txData.from!, poolId)
                .callAsync();
            expect(delegatorStake).to.deep.equal(expectedDelegatorStake);

            const transferEvents = filterLogsToArguments<WETH9TransferEventArgs>(
                result.receipt!.logs,
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
