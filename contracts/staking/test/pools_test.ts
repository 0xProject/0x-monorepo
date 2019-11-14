import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import * as _ from 'lodash';

import { constants as stakingConstants } from '../src/constants';
import StakingRevertErrors = require('../src/staking_revert_errors');

import { MakerActor } from './actors/maker_actor';
import { PoolOperatorActor } from './actors/pool_operator_actor';
import { deployAndConfigureContractsAsync, StakingApiWrapper } from './utils/api_wrapper';

// tslint:disable:no-unnecessary-type-assertion
// tslint:disable:max-file-line-count
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
        [owner, ...users] = accounts;
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
            const lastPoolId = await stakingApiWrapper.stakingContract.lastPoolId().callAsync();
            expect(lastPoolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
        });
        it('Should successfully create several staking pools, as long as the operator is only a maker in one', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);
            // create pool
            const poolId1 = await poolOperator.createStakingPoolAsync(operatorShare, true);
            expect(poolId1).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            const poolId2 = await poolOperator.createStakingPoolAsync(operatorShare, false);
            expect(poolId2).to.be.equal(stakingConstants.SECOND_POOL_ID);
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
            const lastPoolId = await stakingApiWrapper.stakingContract.lastPoolId().callAsync();
            expect(lastPoolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
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
        it('Should successfully add a maker to a pool', async () => {
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
            // maker removes themselves from pool
            await maker.joinStakingPoolAsMakerAsync(stakingConstants.NIL_POOL_ID);
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
            // remove makers to pool
            await Promise.all(
                makers.map(async maker => maker.joinStakingPoolAsMakerAsync(stakingConstants.NIL_POOL_ID)),
            );
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
        it('Should be successful if operator calls decreaseStakingPoolOperatorShare and newOperatorShare == oldOperatorShare', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);

            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, false);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);

            // decrease operator share
            await poolOperator.decreaseStakingPoolOperatorShareAsync(poolId, operatorShare);
        });
        it('should fail to decrease operator share if not called by operator', async () => {
            // test parameters
            const operatorAddress = users[0];
            const operatorShare = (39 / 100) * PPM_DENOMINATOR;
            const poolOperator = new PoolOperatorActor(operatorAddress, stakingApiWrapper);
            const makerAddress = users[1];
            const maker = new MakerActor(makerAddress, stakingApiWrapper);
            // create pool
            const poolId = await poolOperator.createStakingPoolAsync(operatorShare, true);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            await maker.decreaseStakingPoolOperatorShareAsync(
                poolId,
                operatorShare - 1,
                new StakingRevertErrors.OnlyCallableByPoolOperatorError(makerAddress, poolId),
            );
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
