import { BlockchainBalanceStore, LocalBalanceStore } from '@0x/contracts-exchange';
import { assetDataUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import { TxData } from 'ethereum-types';

import { DeploymentManager } from '../utils/deployment_manager';
import { FunctionAssertion } from '../utils/function_assertions';

export function validUnstakeAssertion(
    deployment: DeploymentManager,
    balanceStore: BlockchainBalanceStore,
): FunctionAssertion<LocalBalanceStore> {
    const { stakingWrapper, zrxVault } = deployment.staking;
    const { zrx } = deployment.tokens;

    return new FunctionAssertion(stakingWrapper.unstake, {
        before: async (amount: BigNumber, txData: Partial<TxData>) => {
            const expectedBalances = LocalBalanceStore.create(balanceStore);
            expectedBalances.transferAsset(
                zrxVault.address,
                txData.from as string,
                amount,
                assetDataUtils.encodeERC20AssetData(zrx.address),
            );
            return expectedBalances;
        },
        after: async (expectedBalances: LocalBalanceStore) => {
            await balanceStore.updateErc20BalancesAsync();
            balanceStore.assertEquals(expectedBalances);
        },
    });
}
