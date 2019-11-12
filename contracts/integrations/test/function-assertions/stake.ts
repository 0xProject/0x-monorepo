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
        currentEpochBalance: initStake[StakeStatus.Undelegated].currentEpochBalance.plus(amount),
        nextEpochBalance: initStake[StakeStatus.Undelegated].nextEpochBalance.plus(amount),
    };
}

/**
 * Returns a FunctionAssertion for `stake` which assumes valid input is provided. The
 * FunctionAssertion checks that the staker and zrxVault's balances of ZRX decrease and increase,
 * respectively, by the input amount.
 */
export function validStakeAssertion(
    deployment: DeploymentManager,
    balanceStore: BlockchainBalanceStore,
    globalStake: GlobalStakeByStatus,
    ownerStake: OwnerStakeByStatus,
): FunctionAssertion<LocalBalanceStore> {
    const { stakingWrapper, zrxVault } = deployment.staking;

    return new FunctionAssertion(stakingWrapper.stake, {
        before: async (amount: BigNumber, txData: Partial<TxData>) => {
            // Simulates the transfer of ZRX from staker to vault
            const expectedBalances = LocalBalanceStore.create(deployment.devUtils, balanceStore);
            await expectedBalances.transferAssetAsync(
                txData.from as string,
                zrxVault.address,
                amount,
                await deployment.devUtils.encodeERC20AssetData.callAsync(deployment.tokens.zrx.address),
            );
            return expectedBalances;
        },
        after: async (
            expectedBalances: LocalBalanceStore,
            _result: FunctionResult,
            amount: BigNumber,
            txData: Partial<TxData>,
        ) => {
            logUtils.log(`stake(${amount})`);

            // Checks that the ZRX transfer updated balances as expected.
            await balanceStore.updateErc20BalancesAsync();
            balanceStore.assertEquals(expectedBalances);

            // Checks that the owner's undelegated stake has increased by the stake amount
            const ownerUndelegatedStake = await stakingWrapper.getOwnerStakeByStatus.callAsync(
                txData.from as string,
                StakeStatus.Undelegated,
            );
            const expectedOwnerUndelegatedStake = expectedUndelegatedStake(ownerStake, amount);
            expect(ownerUndelegatedStake, 'Owner undelegated stake').to.deep.equal(expectedOwnerUndelegatedStake);
            // Updates local state accordingly
            ownerStake[StakeStatus.Undelegated] = expectedOwnerUndelegatedStake;

            // Checks that the global undelegated stake has also increased by the stake amount
            const globalUndelegatedStake = await stakingWrapper.getGlobalStakeByStatus.callAsync(
                StakeStatus.Undelegated,
            );
            const expectedGlobalUndelegatedStake = expectedUndelegatedStake(globalStake, amount);
            expect(globalUndelegatedStake, 'Global undelegated stake').to.deep.equal(expectedGlobalUndelegatedStake);
            // Updates local state accordingly
            globalStake[StakeStatus.Undelegated] = expectedGlobalUndelegatedStake;
        },
    });
}
