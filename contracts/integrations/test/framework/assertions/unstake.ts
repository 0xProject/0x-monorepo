import { encodeERC20AssetData } from '@0x/contracts-asset-proxy';
import {
    decreaseCurrentAndNextBalance,
    OwnerStakeByStatus,
    StakeStatus,
    StakingRevertErrors,
} from '@0x/contracts-staking';
import { expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TxData } from 'ethereum-types';

import { LocalBalanceStore } from '../balances/local_balance_store';
import { DeploymentManager } from '../deployment_manager';
import { SimulationEnvironment } from '../simulation';

import { FunctionAssertion, FunctionResult } from './function_assertion';

/**
 * Returns a FunctionAssertion for `unstake` which assumes valid input is provided. The
 * FunctionAssertion checks that the staker and zrxVault's balances of ZRX increase and decrease,
 * respectively, by the input amount.
 */
/* tslint:disable:no-unnecessary-type-assertion */
export function validUnstakeAssertion(
    deployment: DeploymentManager,
    simulationEnvironment: SimulationEnvironment,
    ownerStake: OwnerStakeByStatus,
): FunctionAssertion<[BigNumber], LocalBalanceStore, void> {
    const { stakingWrapper, zrxVault } = deployment.staking;

    return new FunctionAssertion(stakingWrapper, 'unstake', {
        before: async (args: [BigNumber], txData: Partial<TxData>) => {
            const [amount] = args;
            const { balanceStore } = simulationEnvironment;

            // Simulates the transfer of ZRX from vault to staker
            const expectedBalances = LocalBalanceStore.create(balanceStore);
            expectedBalances.transferAsset(
                zrxVault.address,
                txData.from as string,
                amount,
                encodeERC20AssetData(deployment.tokens.zrx.address),
            );
            return expectedBalances;
        },
        after: async (
            expectedBalances: LocalBalanceStore,
            result: FunctionResult,
            args: [BigNumber],
            txData: Partial<TxData>,
        ) => {
            // Ensure that the tx succeeded.
            expect(result.success, `Error: ${result.data}`).to.be.true();

            const [amount] = args;
            const { balanceStore, currentEpoch, globalStake } = simulationEnvironment;

            // Checks that the ZRX transfer updated balances as expected.
            await balanceStore.updateErc20BalancesAsync();
            balanceStore.assertEquals(expectedBalances);

            // _decreaseCurrentAndNextBalance
            ownerStake[StakeStatus.Undelegated] = decreaseCurrentAndNextBalance(
                ownerStake[StakeStatus.Undelegated],
                amount,
                currentEpoch,
            );
            globalStake[StakeStatus.Undelegated] = decreaseCurrentAndNextBalance(
                globalStake[StakeStatus.Undelegated],
                amount,
                currentEpoch,
            );

            // Checks that the owner's undelegated stake has decreased by the stake amount
            const ownerUndelegatedStake = await stakingWrapper
                .getOwnerStakeByStatus(txData.from as string, StakeStatus.Undelegated)
                .callAsync();
            expect(ownerUndelegatedStake, 'Owner undelegated stake').to.deep.equal(ownerStake[StakeStatus.Undelegated]);

            // Checks that the global undelegated stake has also increased by the stake amount
            const globalUndelegatedStake = await stakingWrapper
                .getGlobalStakeByStatus(StakeStatus.Undelegated)
                .callAsync();
            expect(globalUndelegatedStake, 'Global undelegated stake').to.deep.equal(
                globalStake[StakeStatus.Undelegated],
            );
        },
    });
}

/**
 * Returns a FunctionAssertion for `unstake` which assumes that the input exceeds the amount that
 * can be unstaked. Checks that the call reverts with an InsufficientBalanceError. Note that we
 * close over `withdrawableStake` to avoid duplicating work done in the assertion generator.
 */
export function invalidUnstakeAssertion(
    deployment: DeploymentManager,
    withdrawableStake: BigNumber,
): FunctionAssertion<[BigNumber], void, void> {
    return new FunctionAssertion<[BigNumber], void, void>(deployment.staking.stakingWrapper, 'unstake', {
        after: async (_beforeInfo: void, result: FunctionResult, args: [BigNumber]) => {
            // Ensure that the tx reverted.
            expect(result.success).to.be.false();

            const [amount] = args;
            expect(result.data).to.equal(new StakingRevertErrors.InsufficientBalanceError(amount, withdrawableStake));
        },
    });
}
/* tslint:enable:no-unnecessary-type-assertion */
