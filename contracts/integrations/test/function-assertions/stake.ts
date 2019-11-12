import { BlockchainBalanceStore, LocalBalanceStore } from '@0x/contracts-exchange';
import { GlobalStakeByStatus, OwnerStakeByStatus, StakeStatus, StoredBalance } from '@0x/contracts-staking';
import { expect } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { BigNumber, logUtils } from '@0x/utils';
import { TxData } from 'ethereum-types';

import { DeploymentManager } from '../utils/deployment_manager';
import { FunctionAssertion, FunctionResult } from '../utils/function_assertions';

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
    const { zrx } = deployment.tokens;

    return new FunctionAssertion(stakingWrapper.stake, {
        before: async (amount: BigNumber, txData: Partial<TxData>) => {
            const expectedBalances = LocalBalanceStore.create(balanceStore);
            expectedBalances.transferAsset(
                txData.from as string,
                zrxVault.address,
                amount,
                assetDataUtils.encodeERC20AssetData(zrx.address),
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

            await balanceStore.updateErc20BalancesAsync();
            balanceStore.assertEquals(expectedBalances);

            const ownerUndelegatedStake = await stakingWrapper.getOwnerStakeByStatus.callAsync(
                txData.from as string,
                StakeStatus.Undelegated,
            );
            const expectedOwnerUndelegatedStake = expectedUndelegatedStake(ownerStake, amount);
            expect(ownerUndelegatedStake, 'Owner undelegated stake').to.deep.equal(expectedOwnerUndelegatedStake);
            ownerStake[StakeStatus.Undelegated] = expectedOwnerUndelegatedStake;

            const globalUndelegatedStake = await stakingWrapper.getGlobalStakeByStatus.callAsync(
                StakeStatus.Undelegated,
            );
            const expectedGlobalUndelegatedStake = expectedUndelegatedStake(globalStake, amount);
            expect(globalUndelegatedStake, 'Global undelegated stake').to.deep.equal(expectedGlobalUndelegatedStake);
            globalStake[StakeStatus.Undelegated] = expectedGlobalUndelegatedStake;
        },
    });
}
