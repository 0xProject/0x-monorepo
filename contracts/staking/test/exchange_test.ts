import {
    chaiSetup,
    constants,
    expectTransactionFailedAsync,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { constants as stakingConstants } from './utils/constants';

import { StakingWrapper } from './utils/staking_wrapper';

import { ERC20Wrapper, ERC20ProxyContract } from '@0x/contracts-asset-proxy';
import { StakingContract } from '../src';


import { StakerActor } from './actors/StakerActor';
import { DelegatorActor } from './actors/DelegatorActor';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('Exchange Integrations', () => {
    // constants
    const ZRX_TOKEN_DECIMALS = new BigNumber(18);
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    let exchange: string;
    let stakers: string[];
    let makers: string[];
    let delegators: string[];
    let zrxTokenContract: DummyERC20TokenContract;
    let erc20ProxyContract: ERC20ProxyContract;
    // wrappers
    let stakingWrapper: StakingWrapper;
    let erc20Wrapper: ERC20Wrapper;
    // tests
    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        // create accounts
        accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        exchange = accounts[1];
        stakers = accounts.slice(2, 5);
        makers = accounts.slice(4, 10);
        // deploy erc20 proxy
        erc20Wrapper = new ERC20Wrapper(provider, accounts, owner);
        erc20ProxyContract = await erc20Wrapper.deployProxyAsync();
        // deploy zrx token
        [zrxTokenContract] = await erc20Wrapper.deployDummyTokensAsync(1, ZRX_TOKEN_DECIMALS);
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // deploy staking contracts
        stakingWrapper = new StakingWrapper(provider, owner, erc20ProxyContract, zrxTokenContract, accounts);
        await stakingWrapper.deployAndConfigureContracts();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('Exchange Tracking in Staking Contract', () => {
        it('basic exchange tracking', async () => {
            // 1 try querying an invalid addresses
            const invalidAddress = "0x0000000000000000000000000000000000000001";
            const isInvalidAddressValid = await stakingWrapper.isValidExchangeAddressAsync(invalidAddress);
            expect(isInvalidAddressValid).to.be.false();
            // 2 add valid address
            await stakingWrapper.addExchangeAddressAsync(exchange);
            const isValidAddressValid = await stakingWrapper.isValidExchangeAddressAsync(exchange);
            expect(isValidAddressValid).to.be.true();
            // 3 try adding valid address again
            await expectTransactionFailedAsync(
                stakingWrapper.addExchangeAddressAsync(exchange),
                RevertReason.ExchangeAddressAlreadyRegistered
            );
            // 4 remove valid address
            await stakingWrapper.removeExchangeAddressAsync(exchange);
            const isValidAddressStillValid = await stakingWrapper.isValidExchangeAddressAsync(exchange);
            expect(isValidAddressStillValid).to.be.false();
            // 5 try removing valid address again
            await expectTransactionFailedAsync(
                stakingWrapper.removeExchangeAddressAsync(exchange),
                RevertReason.ExchangeAddressNotRegistered
            );
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
