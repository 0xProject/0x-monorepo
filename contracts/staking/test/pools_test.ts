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
describe('Staking Pool Management', () => {
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
    describe('Staking Pool Management', () => {
        it('basic pool management', async() => {
            // create first pool
            const operatorAddress = stakers[0];
            const operatorShare = 39;
            const poolId = await stakingWrapper.createPoolAsync(operatorAddress, operatorShare);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // check that the next pool id was incremented
            const expectedNextPoolId = "0x0000000000000000000000000000000200000000000000000000000000000000";
            const nextPoolId = await stakingWrapper.getNextPoolIdAsync();
            expect(nextPoolId).to.be.equal(expectedNextPoolId);
            // add maker to pool
            const makerAddress = makers[0];
            const makerApproval = stakingWrapper.signApprovalForStakingPool(poolId, makerAddress);
            await stakingWrapper.addMakerToPoolAsync(poolId, makerAddress, makerApproval.signature, operatorAddress);
            // check the pool id of the maker
            const poolIdOfMaker = await stakingWrapper.getMakerPoolId(makerAddress);
            expect(poolIdOfMaker).to.be.equal(poolId);
            // check the list of makers for the pool
            const makerAddressesForPool = await stakingWrapper.getMakerAddressesForPool(poolId);
            expect(makerAddressesForPool).to.be.deep.equal([makerAddress]);
            // try to add the same maker address again
            await expectTransactionFailedAsync(
                stakingWrapper.addMakerToPoolAsync(poolId, makerAddress, makerApproval.signature, operatorAddress),
                RevertReason.MakerAddressAlreadyRegistered
            );
            // try to add a new maker address with a bad signature
            const anotherMakerAddress = makers[1];
            const badPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(operatorAddress)];
            const anotherMakerApproval = stakingWrapper.signApprovalForStakingPool(poolId, anotherMakerAddress, badPrivateKey);
            await expectTransactionFailedAsync(
                stakingWrapper.addMakerToPoolAsync(poolId, anotherMakerAddress, anotherMakerApproval.signature, operatorAddress),
                RevertReason.InvalidMakerSignature
            );
            // try to add a new maker address from an address other than the pool operator
            const notOperatorAddress = owner;
            const anotherMakerAddress2 = makers[1];
            const anotherMakerApproval2 = stakingWrapper.signApprovalForStakingPool(poolId, anotherMakerAddress);
            await expectTransactionFailedAsync(
                stakingWrapper.addMakerToPoolAsync(poolId, anotherMakerAddress2, anotherMakerApproval2.signature, notOperatorAddress),
                RevertReason.OnlyCallableByPoolOperator
            );
            // try to remove the maker address from an address other than the operator
            await expectTransactionFailedAsync(
                stakingWrapper.removeMakerFromPoolAsync(poolId, makerAddress, notOperatorAddress),
                RevertReason.OnlyCallableByPoolOperator
            );
            // remove maker from pool
            await stakingWrapper.removeMakerFromPoolAsync(poolId, makerAddress, operatorAddress);
            // check the pool id of the maker
            const poolIdOfMakerAfterRemoving = await stakingWrapper.getMakerPoolId(makerAddress);
            expect(poolIdOfMakerAfterRemoving).to.be.equal(stakingConstants.NIL_POOL_ID);
            // check the list of makers for the pool
            const makerAddressesForPoolAfterRemoving = await stakingWrapper.getMakerAddressesForPool(poolId);
            expect(makerAddressesForPoolAfterRemoving).to.be.deep.equal([]);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
