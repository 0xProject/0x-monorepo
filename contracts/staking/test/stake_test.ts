import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { blockchainTests } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { DelegatorActor } from './actors/delegator_actor';
import { StakerActor } from './actors/staker_actor';
import { StakingWrapper } from './utils/staking_wrapper';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests('Staking & Delegating', env => {
    // constants
    const ZRX_TOKEN_DECIMALS = new BigNumber(18);
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    let stakers: string[];
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
        stakers = accounts.slice(2, 5);
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
    blockchainTests.resets('Staking', () => {
    });

    blockchainTests.resets('Delegating', () => {
    });
});
// tslint:enable:no-unnecessary-type-assertion
