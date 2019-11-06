import { blockchainTests, expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts, TestMixinCumulativeRewardsContract } from '../../src';

import { constants as stakingConstants } from '../utils/constants';
import { toBaseUnitAmount } from '../utils/number_utils';

blockchainTests.resets('MixinCumulativeRewards unit tests', env => {
    const ZERO = new BigNumber(0);
    const testRewards = [
        {
            numerator: new BigNumber(1),
            denominator: new BigNumber(2),
        },
        {
            numerator: new BigNumber(3),
            denominator: new BigNumber(4),
        },
    ];
    const sumOfTestRewardsNormalized = {
        numerator: new BigNumber(10),
        denominator: new BigNumber(8),
    };
    let testPoolId: string;
    let testContract: TestMixinCumulativeRewardsContract;

    before(async () => {
        // Deploy contracts
        testContract = await TestMixinCumulativeRewardsContract.deployFrom0xArtifactAsync(
            artifacts.TestMixinCumulativeRewards,
            env.provider,
            env.txDefaults,
            artifacts,
            stakingConstants.NIL_ADDRESS,
            stakingConstants.NIL_ADDRESS,
        );

        // Create a test pool
        const operatorShare = new BigNumber(1);
        const addOperatorAsMaker = true;
        const txReceipt = await testContract.createStakingPool.awaitTransactionSuccessAsync(
            operatorShare,
            addOperatorAsMaker,
        );
        const createStakingPoolLog = txReceipt.logs[0];
        testPoolId = (createStakingPoolLog as any).args.poolId;
    });

    describe('_isCumulativeRewardSet', () => {
        it('Should return true iff denominator is non-zero', async () => {
            const isSet = await testContract.isCumulativeRewardSet.callAsync({
                numerator: ZERO,
                denominator: new BigNumber(1),
            });
            expect(isSet).to.be.true();
        });
        it('Should return false iff denominator is zero', async () => {
            const isSet = await testContract.isCumulativeRewardSet.callAsync({
                numerator: new BigNumber(1),
                denominator: ZERO,
            });
            expect(isSet).to.be.false();
        });
    });

    describe('_addCumulativeReward', () => {
        it('Should set value to `reward/stake` if this is the first cumulative reward', async () => {
            await testContract.addCumulativeReward.awaitTransactionSuccessAsync(
                testPoolId,
                testRewards[0].numerator,
                testRewards[0].denominator,
            );
            const mostRecentCumulativeReward = await testContract.getMostRecentCumulativeReward.callAsync(testPoolId);
            expect(mostRecentCumulativeReward).to.deep.equal(testRewards[0]);
        });

        it('Should do nothing if a cumulative reward has already been recorded in the current epoch (`lastStoredEpoch == currentEpoch_`)', async () => {
            await testContract.addCumulativeReward.awaitTransactionSuccessAsync(
                testPoolId,
                testRewards[0].numerator,
                testRewards[0].denominator,
            );
            // this call should not overwrite existing value (testRewards[0])
            await testContract.addCumulativeReward.awaitTransactionSuccessAsync(
                testPoolId,
                testRewards[1].numerator,
                testRewards[1].denominator,
            );
            const mostRecentCumulativeReward = await testContract.getMostRecentCumulativeReward.callAsync(testPoolId);
            expect(mostRecentCumulativeReward).to.deep.equal(testRewards[0]);
        });

        it('Should set value to normalized sum of `reward/stake` plus most recent cumulative reward, given one exists', async () => {
            await testContract.addCumulativeReward.awaitTransactionSuccessAsync(
                testPoolId,
                testRewards[0].numerator,
                testRewards[0].denominator,
            );
            await testContract.incrementEpoch.awaitTransactionSuccessAsync();
            await testContract.addCumulativeReward.awaitTransactionSuccessAsync(
                testPoolId,
                testRewards[1].numerator,
                testRewards[1].denominator,
            );
            const mostRecentCumulativeReward = await testContract.getMostRecentCumulativeReward.callAsync(testPoolId);
            expect(mostRecentCumulativeReward).to.deep.equal(sumOfTestRewardsNormalized);
        });
    });

    describe('_updateCumulativeReward', () => {
        it('Should set current cumulative reward to most recent cumulative reward', async () => {
            await testContract.addCumulativeReward.awaitTransactionSuccessAsync(
                testPoolId,
                testRewards[0].numerator,
                testRewards[0].denominator,
            );
            await testContract.incrementEpoch.awaitTransactionSuccessAsync();
            await testContract.updateCumulativeReward.awaitTransactionSuccessAsync(testPoolId);
            const epoch = new BigNumber(2);
            const mostRecentCumulativeReward = await testContract.getCumulativeRewardAtEpochRaw.callAsync(
                testPoolId,
                epoch,
            );
            expect(mostRecentCumulativeReward).to.deep.equal(testRewards[0]);
        });
    });

    describe('_computeMemberRewardOverInterval', () => {
        const runTest = async (
            amountToStake: BigNumber,
            epochOfFirstReward: BigNumber,
            epochOfSecondReward: BigNumber,
            epochOfIntervalStart: BigNumber,
            epochOfIntervalEnd: BigNumber,
        ): Promise<void> => {
            // Simulate earning reward
            await testContract.storeCumulativeReward.awaitTransactionSuccessAsync(
                testPoolId,
                testRewards[0],
                epochOfFirstReward,
            );
            await testContract.storeCumulativeReward.awaitTransactionSuccessAsync(
                testPoolId,
                sumOfTestRewardsNormalized,
                epochOfSecondReward,
            );
            const reward = await testContract.computeMemberRewardOverInterval.callAsync(
                testPoolId,
                amountToStake,
                epochOfIntervalStart,
                epochOfIntervalEnd,
            );
            // Compute expected reward
            const lhs = sumOfTestRewardsNormalized.numerator.dividedBy(sumOfTestRewardsNormalized.denominator);
            const rhs = testRewards[0].numerator.dividedBy(testRewards[0].denominator);
            const expectedReward = lhs.minus(rhs).multipliedBy(amountToStake);
            // Assert correctness
            expect(reward).to.bignumber.equal(expectedReward);
        };

        it('Should successfully compute reward over a valid interval when staking non-zero ZRX', async () => {
            const amountToStake = toBaseUnitAmount(1);
            const epochOfFirstReward = new BigNumber(1);
            const epochOfSecondReward = new BigNumber(2);
            const epochOfIntervalStart = new BigNumber(1);
            const epochOfIntervalEnd = new BigNumber(2);
            await runTest(
                amountToStake,
                epochOfFirstReward,
                epochOfSecondReward,
                epochOfIntervalStart,
                epochOfIntervalEnd,
            );
        });

        it('Should successfully compute reward if no entry for current epoch, but there is an entry for epoch n-1', async () => {
            // End epoch = n-1 forces the code to query the previous epoch's cumulative reward
            const amountToStake = toBaseUnitAmount(1);
            const epochOfFirstReward = new BigNumber(1);
            const epochOfSecondReward = new BigNumber(2);
            const epochOfIntervalStart = new BigNumber(1);
            const epochOfIntervalEnd = new BigNumber(3);
            await runTest(
                amountToStake,
                epochOfFirstReward,
                epochOfSecondReward,
                epochOfIntervalStart,
                epochOfIntervalEnd,
            );
        });

        it('Should successfully compute reward if no entry for current epoch, but there is an entry for epoch n-2', async () => {
            // End epoch = n-2 forces the code to query the most recent cumulative reward
            const amountToStake = toBaseUnitAmount(1);
            const epochOfFirstReward = new BigNumber(1);
            const epochOfSecondReward = new BigNumber(2);
            const epochOfIntervalStart = new BigNumber(1);
            const epochOfIntervalEnd = new BigNumber(4);
            await runTest(
                amountToStake,
                epochOfFirstReward,
                epochOfSecondReward,
                epochOfIntervalStart,
                epochOfIntervalEnd,
            );
        });

        it('Should successfully compute reward are no cumulative reward entries', async () => {
            // No entries forces the default cumulatie reward to be used in computations
            const stake = toBaseUnitAmount(1);
            const beginEpoch = new BigNumber(1);
            const endEpoch = new BigNumber(2);
            const reward = await testContract.computeMemberRewardOverInterval.callAsync(
                testPoolId,
                stake,
                beginEpoch,
                endEpoch,
            );
            expect(reward).to.bignumber.equal(ZERO);
        });

        it('Should return zero if no stake was delegated', async () => {
            const stake = toBaseUnitAmount(0);
            const beginEpoch = new BigNumber(1);
            const endEpoch = new BigNumber(2);
            const reward = await testContract.computeMemberRewardOverInterval.callAsync(
                testPoolId,
                stake,
                beginEpoch,
                endEpoch,
            );
            expect(reward).to.bignumber.equal(ZERO);
        });

        it('Should return zero if the start/end of the interval are the same epoch', async () => {
            const stake = toBaseUnitAmount(1);
            const beginEpoch = new BigNumber(1);
            const endEpoch = new BigNumber(1);
            const reward = await testContract.computeMemberRewardOverInterval.callAsync(
                testPoolId,
                stake,
                beginEpoch,
                endEpoch,
            );
            expect(reward).to.bignumber.equal(ZERO);
        });

        it('Should revert if start is greater than the end of the interval', async () => {
            const stake = toBaseUnitAmount(1);
            const beginEpoch = new BigNumber(2);
            const endEpoch = new BigNumber(1);
            const tx = testContract.computeMemberRewardOverInterval.callAsync(testPoolId, stake, beginEpoch, endEpoch);
            return expect(tx).to.revertWith('CR_INTERVAL_INVALID');
        });
    });
});
