import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
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
        stakingWrapper = new StakingWrapper(env.provider, owner, erc20ProxyContract, zrxTokenContract);
        await stakingWrapper.deployAndConfigureContractsAsync();
    });
    blockchainTests.resets('Staking Pool Management', () => {
        it('Should successfully create a pool', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, false);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // check that the next pool id was incremented
            const nextPoolId = await stakingWrapper.getNextStakingPoolIdAsync();
            expect(nextPoolId).to.be.equal(stakingConstants.SECOND_POOL_ID);
        });
        it('Should successfully create a pool and add owner as a maker', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, true);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // check that the next pool id was incremented
            const nextPoolId = await stakingWrapper.getNextStakingPoolIdAsync();
            expect(nextPoolId).to.be.equal(stakingConstants.SECOND_POOL_ID);
        });
        it('Should throw if poolOperatorShare is > PPM_DENOMINATOR', async () => {
            // test parameters
            const operatorAddress = users[0];
            // tslint:disable-next-line
            const operatorShare = PPM_100_PERCENT + 1;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            // create pool
            const tx = poolOperator.createStakingPoolAsync(operatorShare, true);
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
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, true);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // maker joins pool
            await maker.joinStakingPoolAsMakerAsync(poolId);
            // operator adds maker to pool
            await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress);
            // operator removes maker from pool
            await poolOperator.removeMakerFromStakingPoolAsync(poolId, makerAddress);
        });
        it('Maker should successfully remove themselves from a pool', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            const makerAddress = users[1];
            const maker = new MakerActor(makerAddress, stakingWrapper);
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, true);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // maker joins pool
            await maker.joinStakingPoolAsMakerAsync(poolId);
            // operator adds maker to pool
            await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress);
            // maker removes themselves from pool
            await maker.removeMakerFromStakingPoolAsync(poolId, makerAddress);
        });
        it('Should successfully add/remove multiple makers to the same pool', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            const makerAddresses = users.slice(1, 4);
            const makers = makerAddresses.map(makerAddress => new MakerActor(makerAddress, stakingWrapper));

            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, false);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);

            // add makers to pool
            await Promise.all(makers.map(async maker => maker.joinStakingPoolAsMakerAsync(poolId)));
            await Promise.all(
                makerAddresses.map(async makerAddress => poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress)),
            );

            // check the number of makers in the pool
            let numMakers = await stakingWrapper.getNumberOfMakersInStakingPoolAsync(poolId);
            expect(numMakers, 'number of makers in pool after adding').to.be.bignumber.equal(3);

            // remove maker from pool
            await Promise.all(
                makerAddresses.map(async makerAddress =>
                    poolOperator.removeMakerFromStakingPoolAsync(poolId, makerAddress),
                ),
            );

            // check the number of makers in the pool
            numMakers = await stakingWrapper.getNumberOfMakersInStakingPoolAsync(poolId);
            expect(numMakers, 'number of makers in pool after removing').to.be.bignumber.equal(0);
        });
        it('Should fail if maker already assigned to another pool tries to join', async () => {
            // test parameters
            const operatorShare = 39;
            const assignedPoolOperator = new PoolOperatorActor(users[0], stakingWrapper);
            const otherPoolOperator = new PoolOperatorActor(users[1], stakingWrapper);

            const makerAddress = users[2];
            const maker = new MakerActor(makerAddress, stakingWrapper);

            // create pools
            const assignedPoolId = await assignedPoolOperator.createStakingPoolAsync(operatorShare, true);
            const otherPoolId = await otherPoolOperator.createStakingPoolAsync(operatorShare, true);
            expect(assignedPoolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            expect(otherPoolId).to.be.equal(stakingConstants.SECOND_POOL_ID);

            // maker joins first pool
            await maker.joinStakingPoolAsMakerAsync(assignedPoolId);
            // first pool operator adds maker
            await assignedPoolOperator.addMakerToStakingPoolAsync(assignedPoolId, makerAddress);

            const revertError = new StakingRevertErrors.MakerPoolAssignmentError(
                StakingRevertErrors.MakerPoolAssignmentErrorCodes.MakerAddressAlreadyRegistered,
                makerAddress,
                assignedPoolId,
            );
            // second pool operator now tries to add maker
            await otherPoolOperator.addMakerToStakingPoolAsync(otherPoolId, makerAddress, revertError);
        });
        it('Should fail to add maker to pool if the maker has not joined any pools', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);

            const makerAddress = users[1];

            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, true);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);

            const revertError = new StakingRevertErrors.MakerPoolAssignmentError(
                StakingRevertErrors.MakerPoolAssignmentErrorCodes.MakerAddressNotPendingAdd,
                makerAddress,
                stakingConstants.NIL_POOL_ID,
            );
            // operator adds maker to pool
            await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress, revertError);
        });
        it('Should fail to add maker to pool if the maker joined a different pool', async () => {
            // test parameters
            const operatorShare = 39;
            const assignedPoolOperator = new PoolOperatorActor(users[0], stakingWrapper);
            const otherPoolOperator = new PoolOperatorActor(users[1], stakingWrapper);

            const makerAddress = users[2];
            const maker = new MakerActor(makerAddress, stakingWrapper);

            // create pools
            const joinedPoolId = await assignedPoolOperator.createStakingPoolAsync(operatorShare, true);
            const otherPoolId = await otherPoolOperator.createStakingPoolAsync(operatorShare, true);
            expect(joinedPoolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            expect(otherPoolId).to.be.equal(stakingConstants.SECOND_POOL_ID);

            // maker joins first pool
            await maker.joinStakingPoolAsMakerAsync(joinedPoolId);

            const revertError = new StakingRevertErrors.MakerPoolAssignmentError(
                StakingRevertErrors.MakerPoolAssignmentErrorCodes.MakerAddressNotPendingAdd,
                makerAddress,
                joinedPoolId,
            );
            // second pool operator now tries to add maker
            await otherPoolOperator.addMakerToStakingPoolAsync(otherPoolId, makerAddress, revertError);
        });
        it('Should fail to add the same maker twice', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            const makerAddress = users[1];
            const maker = new MakerActor(makerAddress, stakingWrapper);
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, true);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // add maker to pool
            await maker.joinStakingPoolAsMakerAsync(poolId);
            await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress);
            const revertError = new StakingRevertErrors.MakerPoolAssignmentError(
                StakingRevertErrors.MakerPoolAssignmentErrorCodes.MakerAddressAlreadyRegistered,
                makerAddress,
                poolId,
            );
            // add same maker to pool again
            await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress, revertError);
        });
        it('Should fail to remove a maker that does not exist', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            const makerAddress = users[1];
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, true);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            const revertError = new StakingRevertErrors.MakerPoolAssignmentError(
                StakingRevertErrors.MakerPoolAssignmentErrorCodes.MakerAddressNotRegistered,
                makerAddress,
                stakingConstants.NIL_POOL_ID,
            );
            // remove non-existent maker from pool
            await poolOperator.removeMakerFromStakingPoolAsync(poolId, makerAddress, revertError);
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
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, true);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // add maker to pool
            await maker.joinStakingPoolAsMakerAsync(poolId);
            const revertError = new StakingRevertErrors.OnlyCallableByPoolOperatorError(
                notOperatorAddress,
                operatorAddress,
            );
            const tx = stakingWrapper.addMakerToStakingPoolAsync(poolId, makerAddress, notOperatorAddress);
            await expect(tx).to.revertWith(revertError);
        });
        it('Should fail to remove a maker when called by someone other than the pool operator or maker', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);
            const makerAddress = users[1];
            const maker = new MakerActor(makerAddress, stakingWrapper);
            const neitherOperatorNorMakerAddress = users[2];
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, true);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // add maker to pool
            await maker.joinStakingPoolAsMakerAsync(poolId);
            await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress);
            // try to remove the maker address from an address other than the operator
            const revertError = new StakingRevertErrors.OnlyCallableByPoolOperatorOrMakerError(
                neitherOperatorNorMakerAddress,
                operatorAddress,
                makerAddress,
            );
            const tx = stakingWrapper.removeMakerFromStakingPoolAsync(
                poolId,
                makerAddress,
                neitherOperatorNorMakerAddress,
            );
            await expect(tx).to.revertWith(revertError);
        });
        it('Should fail to add a maker if the pool is full', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = 39;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingWrapper);

            const makerAddresses = users.slice(1, stakingConstants.MAX_MAKERS_IN_POOL + 2);
            const makers = makerAddresses.map(makerAddress => new MakerActor(makerAddress, stakingWrapper));

            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, false);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);

            // add makers to pool
            await Promise.all(makers.map(async maker => maker.joinStakingPoolAsMakerAsync(poolId)));
            await Promise.all(
                _.initial(makerAddresses).map(async makerAddress =>
                    poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress),
                ),
            );

            // check the number of makers in the pool
            const numMakers = await stakingWrapper.getNumberOfMakersInStakingPoolAsync(poolId);
            expect(numMakers, 'number of makers in pool').to.be.bignumber.equal(stakingConstants.MAX_MAKERS_IN_POOL);

            const lastMakerAddress = _.last(makerAddresses) as string;
            // Try to add last maker to the pool
            const revertError = new StakingRevertErrors.MakerPoolAssignmentError(
                StakingRevertErrors.MakerPoolAssignmentErrorCodes.PoolIsFull,
                lastMakerAddress,
                poolId,
            );
            await poolOperator.addMakerToStakingPoolAsync(poolId, lastMakerAddress, revertError);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
