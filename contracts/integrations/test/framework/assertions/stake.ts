import { encodeERC20AssetData } from '@0x/contracts-asset-proxy';
import { increaseCurrentAndNextBalance, OwnerStakeByStatus, StakeStatus } from '@0x/contracts-staking';
import { expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TxData } from 'ethereum-types';

import { LocalBalanceStore } from '../balances/local_balance_store';
import { DeploymentManager } from '../deployment_manager';
import { SimulationEnvironment } from '../simulation';

import { FunctionAssertion, FunctionResult } from './function_assertion';

/**
 * Returns a FunctionAssertion for `stake` which assumes valid input is provided. The
 * FunctionAssertion checks that the staker and zrxVault's balances of ZRX decrease and increase,
 * respectively, by the input amount.
 */
/* tslint:disable:no-unnecessary-type-assertion */
export function validStakeAssertion(
    deployment: DeploymentManager,
    simulationEnvironment: SimulationEnvironment,
    ownerStake: OwnerStakeByStatus,
): FunctionAssertion<[BigNumber], LocalBalanceStore, void> {
    const { stakingWrapper, zrxVault } = deployment.staking;

    return new FunctionAssertion(stakingWrapper, 'stake', {
        before: async (args: [BigNumber], txData: Partial<TxData>) => {
            const [amount] = args;
            const { balanceStore } = simulationEnvironment;

            // Simulates the transfer of ZRX from staker to vault
            const expectedBalances = LocalBalanceStore.create(balanceStore);
            expectedBalances.transferAsset(
                txData.from as string,
                zrxVault.address,
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

            // _increaseCurrentAndNextBalance
            ownerStake[StakeStatus.Undelegated] = increaseCurrentAndNextBalance(
                ownerStake[StakeStatus.Undelegated],
                amount,
                currentEpoch,
            );
            globalStake[StakeStatus.Undelegated] = increaseCurrentAndNextBalance(
                globalStake[StakeStatus.Undelegated],
                amount,
                currentEpoch,
            );

            // Checks that the owner's undelegated stake has increased by the stake amount
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
/* tslint:enable:no-unnecessary-type-assertion */
