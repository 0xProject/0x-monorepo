import { GlobalStakeByStatus, OwnerStakeByStatus, StakeStatus, StoredBalance } from '@0x/contracts-staking';
import { expect } from '@0x/contracts-test-utils';
import { BigNumber, logUtils } from '@0x/utils';
import { TxData } from 'ethereum-types';

import { BlockchainBalanceStore } from '../balances/blockchain_balance_store';
import { LocalBalanceStore } from '../balances/local_balance_store';
import { DeploymentManager } from '../deployment_manager';

import { FunctionAssertion, FunctionResult } from './function_assertion';

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
/* tslint:disable:no-unnecessary-type-assertion */
export function validStakeAssertion(
    deployment: DeploymentManager,
    balanceStore: BlockchainBalanceStore,
    globalStake: GlobalStakeByStatus,
    ownerStake: OwnerStakeByStatus,
): FunctionAssertion<[BigNumber], LocalBalanceStore, void> {
    const { stakingWrapper, zrxVault } = deployment.staking;

    return new FunctionAssertion(stakingWrapper.stake.bind(stakingWrapper), {
        before: async (args: [BigNumber], txData: Partial<TxData>) => {
            const [amount] = args;

            // Simulates the transfer of ZRX from staker to vault
            const expectedBalances = LocalBalanceStore.create(balanceStore);
            expectedBalances.transferAsset(
                txData.from!, // tslint:disable-line:no-non-null-assertion
                zrxVault.address,
                amount,
                deployment.assetDataEncoder.ERC20Token(deployment.tokens.zrx.address).getABIEncodedTransactionData(),
            );
            return expectedBalances;
        },
        after: async (
            expectedBalances: LocalBalanceStore,
            _result: FunctionResult,
            args: [BigNumber],
            txData: Partial<TxData>,
        ) => {
            const [amount] = args;

            logUtils.log(`stake(${amount})`);

            // Checks that the ZRX transfer updated balances as expected.
            await balanceStore.updateErc20BalancesAsync();
            balanceStore.assertEquals(expectedBalances);

            // Checks that the owner's undelegated stake has increased by the stake amount
            const ownerUndelegatedStake = await stakingWrapper
                .getOwnerStakeByStatus(txData.from!, StakeStatus.Undelegated) // tslint:disable-line:no-non-null-assertion
                .callAsync();
            const expectedOwnerUndelegatedStake = expectedUndelegatedStake(ownerStake, amount);
            expect(ownerUndelegatedStake, 'Owner undelegated stake').to.deep.equal(expectedOwnerUndelegatedStake);
            // Updates local state accordingly
            ownerStake[StakeStatus.Undelegated] = expectedOwnerUndelegatedStake;

            // Checks that the global undelegated stake has also increased by the stake amount
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
/* tslint:enable:no-unnecessary-type-assertion */
