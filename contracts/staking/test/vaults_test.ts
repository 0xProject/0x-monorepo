import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { blockchainTests, expect } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import * as _ from 'lodash';

import { deployAndConfigureContractsAsync, StakingApiWrapper } from './utils/api_wrapper';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests('Staking Vaults', env => {
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    let users: string[];
    // wrappers
    let stakingApiWrapper: StakingApiWrapper;
    let erc20Wrapper: ERC20Wrapper;
    // tests
    before(async () => {
        // create accounts
        accounts = await env.getAccountAddressesAsync();
        owner = accounts[0];
        users = accounts.slice(1);
        // set up ERC20Wrapper
        erc20Wrapper = new ERC20Wrapper(env.provider, accounts, owner);
        // deploy staking contracts
        stakingApiWrapper = await deployAndConfigureContractsAsync(env, owner, erc20Wrapper);
    });
    blockchainTests.resets('Reward Vault', () => {
        // @TODO (hysz): Resolve non-EOA transaction issue so that this test can be unskipped
        it.skip('basic management', async () => {
            // 1 setup test parameters
            const poolOperator = users[0];
            const operatorShare = 39;
            const poolId = await stakingApiWrapper.utils.createStakingPoolAsync(poolOperator, operatorShare, true);
            const notStakingContractAddress = poolOperator;
            // should fail to create pool if it already exists
            let revertError = new StakingRevertErrors.PoolAlreadyExistsError(poolId);
            let tx = stakingApiWrapper.rewardVaultContract.registerStakingPool.awaitTransactionSuccessAsync(
                poolId,
                poolOperator,
                operatorShare,
                { from: stakingApiWrapper.stakingContractAddress },
            );
            await expect(tx).to.revertWith(revertError);
            // should fail to create a pool from an address other than the staking contract
            revertError = new StakingRevertErrors.OnlyCallableByStakingContractError(notStakingContractAddress);
            tx = stakingApiWrapper.rewardVaultContract.registerStakingPool.awaitTransactionSuccessAsync(
                poolId,
                poolOperator,
                operatorShare,
                { from: notStakingContractAddress },
            );
            await expect(tx).to.revertWith(revertError);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
