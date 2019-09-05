import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { MakerActor } from './actors/maker_actor';
import { PoolOperatorActor } from './actors/pool_operator_actor';
import { constants as stakingConstants } from './utils/constants';
import { StakingWrapper } from './utils/staking_wrapper';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests('Staking Pool Management', env => {
    // constants
    const { DUMMY_TOKEN_DECIMALS, PPM_100_PERCENT, PPM_DENOMINATOR } = constants;
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
        [zrxTokenContract] = await erc20Wrapper.deployDummyTokensAsync(1, DUMMY_TOKEN_DECIMALS);
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // deploy staking contracts
        stakingWrapper = new StakingWrapper(env.provider, owner, erc20ProxyContract, zrxTokenContract, accounts);
        await stakingWrapper.deployAndConfigureContractsAsync();
    });
    blockchainTests.resets('Staking Pool Management', () => {
        it('Should successfully create a pool', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // check that the next pool id was incremented
            const expectedNextPoolId = '0x0000000000000000000000000000000200000000000000000000000000000000';
            const nextPoolId = await stakingWrapper.getNextStakingPoolIdAsync();
            expect(nextPoolId).to.be.equal(expectedNextPoolId);
        });
        it('Should throw if poolOperatorShare is > PPM_DENOMINATOR', async () => {
            // test parameters
            const operatorAddress = users[0];
            // tslint:disable-next-line
            const operatorShare = PPM_100_PERCENT + 1;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            // create pool
            const tx = poolOperator.createStakingPoolAsync(operatorShare);
            const expectedPoolId = stakingConstants.INITIAL_POOL_ID;
            const expectedError = new StakingRevertErrors.InvalidPoolOperatorShareError(expectedPoolId, operatorShare);
            return expect(tx).to.revertWith(expectedError);
        });
        it('Should successfully add/remove a maker to a pool', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            const makerAddress = users[1];
            const maker = new MakerActor(makerAddress, stakingWrapper);
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // add maker to pool
            const makerApproval = maker.signApprovalForStakingPool(poolId);
            await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress, makerApproval.signature);
            // remove maker from pool
            await poolOperator.removeMakerFromStakingPoolAsync(poolId, makerAddress);
        });
        it('Should successfully add/remove multipler makers to the same pool', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            const makerAddresses = users.slice(1, 4);
            const makers = [
                new MakerActor(makerAddresses[0], stakingWrapper),
                new MakerActor(makerAddresses[1], stakingWrapper),
                new MakerActor(makerAddresses[2], stakingWrapper),
            ];
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // add makers to pool
            const makerApprovals = [
                makers[0].signApprovalForStakingPool(poolId),
                makers[1].signApprovalForStakingPool(poolId),
                makers[2].signApprovalForStakingPool(poolId),
            ];
            await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddresses[0], makerApprovals[0].signature);
            await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddresses[1], makerApprovals[1].signature);
            await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddresses[2], makerApprovals[2].signature);
            // remove maker from pool
            await poolOperator.removeMakerFromStakingPoolAsync(poolId, makerAddresses[0]);
            await poolOperator.removeMakerFromStakingPoolAsync(poolId, makerAddresses[1]);
            await poolOperator.removeMakerFromStakingPoolAsync(poolId, makerAddresses[2]);
        });
        it('Should fail to add the same maker twice', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            const makerAddress = users[1];
            const maker = new MakerActor(makerAddress, stakingWrapper);
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // add maker to pool
            const makerApproval = maker.signApprovalForStakingPool(poolId);
            await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress, makerApproval.signature);
            const revertError = new StakingRevertErrors.MakerAddressAlreadyRegisteredError(makerAddress);
            // add same maker to pool again
            await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress, makerApproval.signature, revertError);
        });
        it('Should fail to remove a maker that does not exist', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            const makerAddress = users[1];
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            const revertError = new StakingRevertErrors.MakerAddressNotRegisteredError(
                makerAddress,
                stakingConstants.NIL_POOL_ID,
                poolId,
            );
            // remove non-existent maker from pool
            await poolOperator.removeMakerFromStakingPoolAsync(poolId, makerAddress, revertError);
        });
        it('Should fail to add a maker who signed with the wrong private key', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            const makerAddress = users[1];
            const badMakerPrivateKey = ethUtil.toBuffer(
                '0x0000000000000000000000000000000000000000000000000000000000000001',
            );
            const maker = new MakerActor(makerAddress, stakingWrapper, badMakerPrivateKey);
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // add maker to poolxx
            const makerApproval = maker.signApprovalForStakingPool(poolId);
            const revertError = new StakingRevertErrors.InvalidMakerSignatureError(
                poolId,
                makerAddress,
                makerApproval.signature,
            );
            await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress, makerApproval.signature, revertError);
        });
        it('Should fail to add a maker who signed with the wrong staking contract address', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            const makerAddress = users[1];
            const forceMakerKeyLookup = undefined;
            const notStakingContractAddress = users[2];
            const maker = new MakerActor(makerAddress, stakingWrapper, forceMakerKeyLookup, notStakingContractAddress);
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // add maker to pool
            const makerApproval = maker.signApprovalForStakingPool(poolId);
            const revertError = new StakingRevertErrors.InvalidMakerSignatureError(
                poolId,
                makerAddress,
                makerApproval.signature,
            );
            await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress, makerApproval.signature, revertError);
        });
        it('Should fail to add a maker who signed with the wrong chain id', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            const makerAddress = users[1];
            const forceMakerKeyLookup = undefined;
            const forceStakingContractLookup = undefined;
            const badChainId = 209348;
            const maker = new MakerActor(
                makerAddress,
                stakingWrapper,
                forceMakerKeyLookup,
                forceStakingContractLookup,
                badChainId,
            );
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // add maker to pool
            const makerApproval = maker.signApprovalForStakingPool(poolId);
            const revertError = new StakingRevertErrors.InvalidMakerSignatureError(
                poolId,
                makerAddress,
                makerApproval.signature,
            );
            await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress, makerApproval.signature, revertError);
        });
        it('Should fail to add a maker when called by someone other than the pool operator', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            const makerAddress = users[1];
            const maker = new MakerActor(makerAddress, stakingWrapper);
            const notOperatorAddress = users[2];
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // add maker to pool
            const makerApproval = maker.signApprovalForStakingPool(poolId);
            const revertError = new StakingRevertErrors.OnlyCallableByPoolOperatorError(
                notOperatorAddress,
                operatorAddress,
            );
            const tx = stakingWrapper.addMakerToStakingPoolAsync(
                poolId,
                makerAddress,
                makerApproval.signature,
                notOperatorAddress,
            );
            await expect(tx).to.revertWith(revertError);
        });
        it('Should fail to remove a maker when called by someone other than the pool operator', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            const makerAddress = users[1];
            const maker = new MakerActor(makerAddress, stakingWrapper);
            const notOperatorAddress = users[2];
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // add maker to pool
            const makerApproval = maker.signApprovalForStakingPool(poolId);
            await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress, makerApproval.signature);
            // try to remove the maker address from an address other than the operator
            const revertError = new StakingRevertErrors.OnlyCallableByPoolOperatorOrMakerError(
                notOperatorAddress,
                operatorAddress,
                makerAddress,
            );
            const tx = stakingWrapper.removeMakerFromStakingPoolAsync(poolId, makerAddress, notOperatorAddress);
            await expect(tx).to.revertWith(revertError);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
