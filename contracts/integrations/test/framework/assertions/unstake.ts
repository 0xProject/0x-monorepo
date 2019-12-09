import { loadCurrentBalance, OwnerStakeByStatus, StakeStatus } from '@0x/contracts-staking';
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
                deployment.assetDataEncoder.ERC20Token(deployment.tokens.zrx.address).getABIEncodedTransactionData(),
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
            const { balanceStore, currentEpoch } = simulationEnvironment;

            // Checks that the ZRX transfer updated balances as expected.
            await balanceStore.updateErc20BalancesAsync();
            balanceStore.assertEquals(expectedBalances);

            // Checks that the owner's undelegated stake has decreased by the stake amount
            const ownerUndelegatedStake = await stakingWrapper
                .getOwnerStakeByStatus(txData.from as string, StakeStatus.Undelegated)
                .callAsync();
            loadCurrentBalance(ownerStake[StakeStatus.Undelegated], currentEpoch, true);
            ownerStake[StakeStatus.Undelegated].currentEpochBalance = ownerStake[
                StakeStatus.Undelegated
            ].currentEpochBalance.minus(amount);
            ownerStake[StakeStatus.Undelegated].nextEpochBalance = ownerStake[
                StakeStatus.Undelegated
            ].nextEpochBalance.minus(amount);
            expect(ownerUndelegatedStake, 'Owner undelegated stake').to.deep.equal(ownerStake[StakeStatus.Undelegated]);
        },
    });
}
/* tslint:enable:no-unnecessary-type-assertion */
