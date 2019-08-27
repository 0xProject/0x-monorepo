import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { blockchainTests, expect } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { StakingWrapper } from './utils/staking_wrapper';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests('Staking Vaults', env => {
    // constants
    const ZRX_TOKEN_DECIMALS = new BigNumber(18);
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    let users: string[];
    let zrxTokenContract: DummyERC20TokenContract;
    let erc20ProxyContract: ERC20ProxyContract;
    // wrappers
    let stakingWrapper: StakingWrapper;
    let erc20Wrapper: ERC20Wrapper;
    // tests
    before(async () => {
        // create accounts
        accounts = await env.web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        users = accounts.slice(1);
        // deploy erc20 proxy
        erc20Wrapper = new ERC20Wrapper(env.provider, accounts, owner);
        erc20ProxyContract = await erc20Wrapper.deployProxyAsync();
        // deploy zrx token
        [zrxTokenContract] = await erc20Wrapper.deployDummyTokensAsync(1, ZRX_TOKEN_DECIMALS);
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // deploy staking contracts
        stakingWrapper = new StakingWrapper(env.provider, owner, erc20ProxyContract, zrxTokenContract, accounts);
        await stakingWrapper.deployAndConfigureContractsAsync();
    });
    blockchainTests.resets('Reward Vault', () => {
        it.skip('basic management', async () => {
            // 1 setup test parameters
            const poolOperator = users[0];
            const operatorShare = 39;
            const poolId = await stakingWrapper.createStakingPoolAsync(poolOperator, operatorShare);
            const stakingContractAddress = stakingWrapper.getStakingContract().address;
            const notStakingContractAddress = poolOperator;
            // create pool in vault
            await stakingWrapper.rewardVaultRegisterPoolAsync(poolId, operatorShare, stakingContractAddress);
            // should fail to create pool if it already exists
            let revertError = new StakingRevertErrors.PoolAlreadyExistsError(poolId);
            let tx = stakingWrapper.rewardVaultRegisterPoolAsync(poolId, operatorShare, stakingContractAddress);
            await expect(tx).to.revertWith(revertError);
            // should fail to create a pool from an address other than the staking contract
            revertError = new StakingRevertErrors.OnlyCallableByStakingContractError(notStakingContractAddress);
            tx = stakingWrapper.rewardVaultRegisterPoolAsync(poolId, operatorShare, notStakingContractAddress);
            await expect(tx).to.revertWith(revertError);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
