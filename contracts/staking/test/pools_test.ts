import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import * as _ from 'lodash';

import { MakerActor } from './actors/maker_actor';
import { PoolOperatorActor } from './actors/pool_operator_actor';
import { deployAndConfigureContractsAsync, StakingApiWrapper } from './utils/api_wrapper';
import { constants as stakingConstants } from './utils/constants';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests('Staking Pool Management', env => {
    // constants
    const { PPM_100_PERCENT, PPM_DENOMINATOR } = constants;
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
    blockchainTests.resets('Staking Pool Management', () => {
        it('Should successfully create a pool', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, false);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // check that the next pool id was incremented
            const nextPoolId = await stakingApiWrapper.stakingContract.nextPoolId.callAsync();
            expect(nextPoolId).to.be.equal(stakingConstants.SECOND_POOL_ID);
        });
        it('Should fail to create a pool with operator share > 100', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = (101 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);

            const revertError = new StakingRevertErrors.OperatorShareError(
                StakingRevertErrors.OperatorShareErrorCodes.OperatorShareTooLarge,
                stakingConstants.INITIAL_POOL_ID,
                operatorShare,
            );
            // create pool
            await poolOperator.createStakingPoolAsync(operatorShare, false, revertError);
        });
        it('Should successfully create a pool and add owner as a maker', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, true);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // check that the next pool id was incremented
            const nextPoolId = await stakingApiWrapper.stakingContract.nextPoolId.callAsync();
            expect(nextPoolId).to.be.equal(stakingConstants.SECOND_POOL_ID);
        });
        it('Should throw if operatorShare is > PPM_DENOMINATOR', async () => {
            // test parameters
            const operatorAddress = users[0];
            // tslint:disable-next-line
            const operatorShare = PPM_100_PERCENT + 1;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);
            // create pool
            const tx = poolOperator.createStakingPoolAsync(operatorShare, true);
            const expectedPoolId = stakingConstants.INITIAL_POOL_ID;
            const expectedError = new StakingRevertErrors.OperatorShareError(
                StakingRevertErrors.OperatorShareErrorCodes.OperatorShareTooLarge,
                expectedPoolId,
                operatorShare,
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('Should successfully add/remove a maker to a pool', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);
            const makerAddress = users[1];
            const maker = new MakerActor(makerAddress, stakingApiWrapper);
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
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);
            const makerAddress = users[1];
            const maker = new MakerActor(makerAddress, stakingApiWrapper);
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
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);
            const makerAddresses = users.slice(1, 4);
            const makers = makerAddresses.map(makerAddress => new MakerActor(makerAddress, stakingApiWrapper));

            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, false);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);

            // add makers to pool
            await Promise.all(makers.map(async maker => maker.joinStakingPoolAsMakerAsync(poolId)));
            await Promise.all(
                makerAddresses.map(async makerAddress => poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress)),
            );

            // check the number of makers in the pool
            let numMakers = await stakingApiWrapper.stakingContract.numMakersByPoolId.callAsync(poolId);
            expect(numMakers, 'number of makers in pool after adding').to.be.bignumber.equal(3);

            // remove maker from pool
            await Promise.all(
                makerAddresses.map(async makerAddress =>
                    poolOperator.removeMakerFromStakingPoolAsync(poolId, makerAddress),
                ),
            );

            // check the number of makers in the pool
            numMakers = await stakingApiWrapper.stakingContract.numMakersByPoolId.callAsync(poolId);
            expect(numMakers, 'number of makers in pool after removing').to.be.bignumber.equal(0);
        });
        it('Should fail if maker already assigned to another pool tries to join', async () => {
            // test parameters
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const assignedPoolOperator = new PoolOperatorActor(users[0], stakingApiWrapper);
            const otherPoolOperator = new PoolOperatorActor(users[1], stakingApiWrapper);

            const makerAddress = users[2];
            const maker = new MakerActor(makerAddress, stakingApiWrapper);

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
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);

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
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const assignedPoolOperator = new PoolOperatorActor(users[0], stakingApiWrapper);
            const otherPoolOperator = new PoolOperatorActor(users[1], stakingApiWrapper);

            const makerAddress = users[2];
            const maker = new MakerActor(makerAddress, stakingApiWrapper);

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
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);
            const makerAddress = users[1];
            const maker = new MakerActor(makerAddress, stakingApiWrapper);
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
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);
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
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);
            const makerAddress = users[1];
            const maker = new MakerActor(makerAddress, stakingApiWrapper);
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
            const tx = stakingApiWrapper.stakingContract.addMakerToStakingPool.awaitTransactionSuccessAsync(
                poolId,
                makerAddress,
                { from: notOperatorAddress },
            );
            await expect(tx).to.revertWith(revertError);
        });
        it('Should fail to remove a maker when called by someone other than the pool operator or maker', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);
            const makerAddress = users[1];
            const maker = new MakerActor(makerAddress, stakingApiWrapper);
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
            const tx = stakingApiWrapper.stakingContract.removeMakerFromStakingPool.awaitTransactionSuccessAsync(
                poolId,
                makerAddress,
                { from: neitherOperatorNorMakerAddress },
            );
            await expect(tx).to.revertWith(revertError);
        });
        it('Should fail to add a maker if the pool is full', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);

            const makerAddresses = users.slice(1, stakingConstants.DEFAULT_PARAMS.maximumMakersInPool.toNumber() + 2);
            const makers = makerAddresses.map(makerAddress => new MakerActor(makerAddress, stakingApiWrapper));

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
            const numMakers = await stakingApiWrapper.stakingContract.numMakersByPoolId.callAsync(poolId);
            expect(numMakers, 'number of makers in pool').to.be.bignumber.equal(
                stakingConstants.DEFAULT_PARAMS.maximumMakersInPool,
            );

            const lastMakerAddress = _.last(makerAddresses) as string;
            // Try to add last maker to the pool
            const revertError = new StakingRevertErrors.MakerPoolAssignmentError(
                StakingRevertErrors.MakerPoolAssignmentErrorCodes.PoolIsFull,
                lastMakerAddress,
                poolId,
            );
            await poolOperator.addMakerToStakingPoolAsync(poolId, lastMakerAddress, revertError);
        });
        it('Operator should successfully decrease their share of rewards', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);

            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, false);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);

            // decrease operator share
            await poolOperator.decreaseStakingPoolOperatorShareAsync(poolId, operatorShare - 1);
        });
        it('Should fail if operator tries to increase their share of rewards', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);

            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, false);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);

            const increasedOperatorShare = operatorShare + 1;
            const revertError = new StakingRevertErrors.OperatorShareError(
                StakingRevertErrors.OperatorShareErrorCodes.CanOnlyDecreaseOperatorShare,
                poolId,
                increasedOperatorShare,
            );
            // decrease operator share
            await poolOperator.decreaseStakingPoolOperatorShareAsync(poolId, increasedOperatorShare, revertError);
        });
        it('Should fail if operator calls decreaseStakingPoolOperatorShare but newOperatorShare == oldOperatorShare', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);

            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, false);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);

            const revertError = new StakingRevertErrors.OperatorShareError(
                StakingRevertErrors.OperatorShareErrorCodes.CanOnlyDecreaseOperatorShare,
                poolId,
                operatorShare,
            );
            // decrease operator share
            await poolOperator.decreaseStakingPoolOperatorShareAsync(poolId, operatorShare, revertError);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
