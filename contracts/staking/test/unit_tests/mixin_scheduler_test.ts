import { blockchainTests, constants, expect, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';

import {
    artifacts,
    StakingRevertErrors,
    TestMixinSchedulerContract,
    TestMixinSchedulerEvents,
    TestMixinSchedulerGoToNextEpochTestInfoEventArgs,
} from '../../src';

import { constants as stakingConstants } from '../utils/constants';

blockchainTests.resets('MixinScheduler unit tests', env => {
    let testContract: TestMixinSchedulerContract;

    before(async () => {
        // Deploy contracts
        testContract = await TestMixinSchedulerContract.deployFrom0xArtifactAsync(
            artifacts.TestMixinScheduler,
            env.provider,
            env.txDefaults,
            artifacts,
            stakingConstants.NIL_ADDRESS,
            stakingConstants.NIL_ADDRESS,
        );
    });

    describe('getCurrentEpochEarliestEndTimeInSeconds', () => {
        it('Should return the sum of `epoch start time + epoch duration`', async () => {
            const testDeployedTimestamp = await testContract.testDeployedTimestamp.callAsync();
            const epochDurationInSeconds = await testContract.epochDurationInSeconds.callAsync();
            const expectedCurrentEpochEarliestEndTimeInSeconds = testDeployedTimestamp.plus(epochDurationInSeconds);
            const currentEpochEarliestEndTimeInSeconds = await testContract.getCurrentEpochEarliestEndTimeInSeconds.callAsync();
            expect(currentEpochEarliestEndTimeInSeconds).to.bignumber.equal(
                expectedCurrentEpochEarliestEndTimeInSeconds,
            );
        });
    });

    describe('_initMixinScheduler', () => {
        it('Should succeed if scheduler is not yet initialized (`currentEpochStartTimeInSeconds == 0`)', async () => {
            const initCurrentEpochStartTimeInSeconds = constants.ZERO_AMOUNT;
            const txReceipt = await testContract.initMixinSchedulerTest.awaitTransactionSuccessAsync(
                initCurrentEpochStartTimeInSeconds,
            );
            // Assert `currentEpochStartTimeInSeconds` was properly initialized
            const blockTimestamp = await env.web3Wrapper.getBlockTimestampAsync(txReceipt.blockNumber);
            const currentEpochStartTimeInSeconds = await testContract.currentEpochStartTimeInSeconds.callAsync();
            expect(currentEpochStartTimeInSeconds).to.bignumber.equal(blockTimestamp);
            // Assert `currentEpoch` was properly initialized
            const currentEpoch = await testContract.currentEpoch.callAsync();
            expect(currentEpoch).to.bignumber.equal(1);
        });

        it('Should revert if scheduler is already initialized (`currentEpochStartTimeInSeconds != 0`)', async () => {
            const initCurrentEpochStartTimeInSeconds = new BigNumber(10);
            const tx = testContract.initMixinSchedulerTest.awaitTransactionSuccessAsync(
                initCurrentEpochStartTimeInSeconds,
            );
            return expect(tx).to.revertWith(
                new StakingRevertErrors.InitializationError(
                    StakingRevertErrors.InitializationErrorCodes.MixinSchedulerAlreadyInitialized,
                ),
            );
        });
    });

    describe('_goToNextEpoch', () => {
        it('Should succeed if epoch end time is strictly less than to block timestamp', async () => {
            const epochEndTimeDelta = new BigNumber(-10);
            const txReceipt = await testContract.goToNextEpochTest.awaitTransactionSuccessAsync(epochEndTimeDelta);
            const currentEpoch = await testContract.currentEpoch.callAsync();
            const currentEpochStartTimeInSeconds = await testContract.currentEpochStartTimeInSeconds.callAsync();
            verifyEventsFromLogs(
                txReceipt.logs,
                [
                    {
                        oldEpoch: currentEpoch.minus(1),
                        blockTimestamp: currentEpochStartTimeInSeconds,
                    },
                ],
                TestMixinSchedulerEvents.GoToNextEpochTestInfo,
            );
        });

        it('Should succeed if epoch end time is equal to block timestamp', async () => {
            const epochEndTimeDelta = constants.ZERO_AMOUNT;
            const txReceipt = await testContract.goToNextEpochTest.awaitTransactionSuccessAsync(epochEndTimeDelta);
            // tslint:disable-next-line no-unnecessary-type-assertion
            const testLog: TestMixinSchedulerGoToNextEpochTestInfoEventArgs = (txReceipt.logs[0] as LogWithDecodedArgs<
                TestMixinSchedulerGoToNextEpochTestInfoEventArgs
            >).args;
            const currentEpoch = await testContract.currentEpoch.callAsync();
            const currentEpochStartTimeInSeconds = await testContract.currentEpochStartTimeInSeconds.callAsync();
            expect(currentEpoch).to.bignumber.equal(testLog.oldEpoch.plus(1));
            expect(currentEpochStartTimeInSeconds).to.bignumber.equal(testLog.blockTimestamp);
        });

        it('Should revert if epoch end time is strictly greater than block timestamp', async () => {
            const epochEndTimeDelta = new BigNumber(10);
            const tx = testContract.goToNextEpochTest.awaitTransactionSuccessAsync(epochEndTimeDelta);
            return expect(tx).to.revertWith(new StakingRevertErrors.BlockTimestampTooLowError());
        });
    });
});
