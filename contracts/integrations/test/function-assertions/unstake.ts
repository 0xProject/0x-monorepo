import { BlockchainBalanceStore, LocalBalanceStore } from '@0x/contracts-exchange';
import { GlobalStakeByStatus, OwnerStakeByStatus, StakeStatus, StoredBalance } from '@0x/contracts-staking';
import { expect } from '@0x/contracts-test-utils';
import { BigNumber, logUtils } from '@0x/utils';
import { TxData } from 'ethereum-types';

import { FunctionAssertion, FunctionResult } from '../../src/function_assertions';
import { DeploymentManager } from '../deployment_manager';

function expectedUndelegatedStake(
    initStake: OwnerStakeByStatus | GlobalStakeByStatus,
    amount: BigNumber,
): StoredBalance {
    return {
        currentEpoch: initStake[StakeStatus.Undelegated].currentEpoch,
        currentEpochBalance: initStake[StakeStatus.Undelegated].currentEpochBalance.minus(amount),
        nextEpochBalance: initStake[StakeStatus.Undelegated].nextEpochBalance.minus(amount),
    };
}

/**
 * Returns a FunctionAssertion for `unstake` which assumes valid input is provided. The
 * FunctionAssertion checks that the staker and zrxVault's balances of ZRX increase and decrease,
 * respectively, by the input amount.
 */
export function validUnstakeAssertion(
    deployment: DeploymentManager,
    balanceStore: BlockchainBalanceStore,
    globalStake: GlobalStakeByStatus,
    ownerStake: OwnerStakeByStatus,
): FunctionAssertion<LocalBalanceStore, void> {
    const { stakingWrapper, zrxVault } = deployment.staking;

    return new FunctionAssertion(stakingWrapper.unstake, {
        before: async (amount: BigNumber, txData: Partial<TxData>) => {
            // Simulates the transfer of ZRX from vault to staker
            const expectedBalances = LocalBalanceStore.create(deployment.devUtils, balanceStore);
            await expectedBalances.transferAssetAsync(
                zrxVault.address,
                txData.from as string,
                amount,
                await deployment.devUtils.encodeERC20AssetData(deployment.tokens.zrx.address).callAsync(),
            );
            return expectedBalances;
        },
        after: async (
            expectedBalances: LocalBalanceStore,
            _result: FunctionResult,
            amount: BigNumber,
            txData: Partial<TxData>,
        ) => {
            logUtils.log(`unstake(${amount})`);

            // Checks that the ZRX transfer updated balances as expected.
            await balanceStore.updateErc20BalancesAsync();
            balanceStore.assertEquals(expectedBalances);

            // Checks that the owner's undelegated stake has decreased by the stake amount
            const ownerUndelegatedStake = await stakingWrapper
                .getOwnerStakeByStatus(txData.from as string, StakeStatus.Undelegated)
                .callAsync();
            const expectedOwnerUndelegatedStake = expectedUndelegatedStake(ownerStake, amount);
            expect(ownerUndelegatedStake, 'Owner undelegated stake').to.deep.equal(expectedOwnerUndelegatedStake);
            // Updates local state accordingly
            ownerStake[StakeStatus.Undelegated] = expectedOwnerUndelegatedStake;

            // Checks that the global undelegated stake has also decreased by the stake amount
            const globalUndelegatedStake = await stakingWrapper
                .getGlobalStakeByStatus(StakeStatus.Undelegated)
                .callAsync();
            const expectedGlobalUndelegatedStake = expectedUndelegatedStake(globalStake, amount);
            expect(globalUndelegatedStake, 'Global undelegated stake').to.deep.equal(expectedGlobalUndelegatedStake);
            // Updates local state accordingly
            globalStake[StakeStatus.Undelegated] = expectedGlobalUndelegatedStake;
        },
    });
}
