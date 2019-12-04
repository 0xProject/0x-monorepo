import { WETH9TransferEventArgs, WETH9Events } from '@0x/contracts-erc20';
import { StoredBalance } from '@0x/contracts-staking';
import { expect, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TxData } from 'ethereum-types';

import { DeploymentManager } from '../deployment_manager';
import { SimulationEnvironment } from '../simulation';

import { FunctionAssertion, FunctionResult } from './function_assertion';

interface WithdrawDelegatorRewardsBeforeInfo {
    delegatorStake: StoredBalance;
    poolRewards: BigNumber;
    wethReservedForPoolRewards: BigNumber;
    delegatorReward: BigNumber;
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
    const { currentEpoch } = simulationEnvironment;

    return new FunctionAssertion(stakingWrapper, 'withdrawDelegatorRewards', {
        before: async (args: [string], txData: Partial<TxData>) => {
            const [poolId] = args;
            const delegatorStake = await stakingWrapper
                .getStakeDelegatedToPoolByOwner(txData.from!, poolId)
                .callAsync();
            const poolRewards = await stakingWrapper.rewardsByPoolId(poolId).callAsync();
            const wethReservedForPoolRewards = await stakingWrapper.wethReservedForPoolRewards().callAsync();
            const delegatorReward = BigNumber.sum(
                await stakingWrapper
                    .computeMemberRewardOverInterval(
                        poolId,
                        delegatorStake.currentEpochBalance,
                        delegatorStake.currentEpoch,
                        delegatorStake.currentEpoch.plus(1),
                    )
                    .callAsync(),
                await stakingWrapper
                    .computeMemberRewardOverInterval(
                        poolId,
                        delegatorStake.nextEpochBalance,
                        delegatorStake.currentEpoch.plus(1),
                        currentEpoch,
                    )
                    .callAsync(),
            ); // TODO: Test the reward computation more robustly
            return { delegatorStake, poolRewards, wethReservedForPoolRewards, delegatorReward };
        },
        after: async (
            beforeInfo: WithdrawDelegatorRewardsBeforeInfo,
            result: FunctionResult,
            args: [string],
            txData: Partial<TxData>,
        ) => {
            const [poolId] = args;

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

            const expectedPoolRewards = beforeInfo.poolRewards.minus(beforeInfo.delegatorReward);
            const poolRewards = await stakingWrapper.rewardsByPoolId(poolId).callAsync();
            expect(poolRewards).to.bignumber.equal(expectedPoolRewards);

            const expectedTransferEvents = beforeInfo.delegatorReward.isZero()
                ? []
                : [{ _from: stakingWrapper.address, _to: txData.from!, _value: beforeInfo.delegatorReward }];
            verifyEventsFromLogs<WETH9TransferEventArgs>(
                result.receipt!.logs,
                expectedTransferEvents,
                WETH9Events.Transfer,
            );

            // TODO: Check CR
        },
    });
}
/* tslint:enable:no-unnecessary-type-assertion */
