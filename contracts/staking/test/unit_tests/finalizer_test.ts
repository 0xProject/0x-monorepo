import { blockchainTests, expect, filterLogsToArguments, Numberish } from '@0x/contracts-test-utils';

import {
    artifacts,
    IStakingEventsEpochEndedEventArgs,
    IStakingEventsEpochFinalizedEventArgs,
    IStakingEventsEvents,
    TestFinalizerContract,
} from '../../src';

blockchainTests.resets.only('finalization tests', env => {
    let testContract: TestFinalizerContract;
    const INITIAL_EPOCH = 0;

    before(async () => {
        testContract = await TestFinalizerContract.deployFrom0xArtifactAsync(
            artifacts.TestFinalizer,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    describe('endEpoch()', () => {
        it('emits an `EpochEnded` event', async () => {
            const receipt = await testContract.endEpoch.awaitTransactionSuccessAsync();
            const [epochEndedEvent] = filterLogsToArguments<IStakingEventsEpochEndedEventArgs>(
                receipt.logs,
                IStakingEventsEvents.EpochEnded,
            );
            expect(epochEndedEvent.epoch).to.bignumber.eq(INITIAL_EPOCH);
            expect(epochEndedEvent.numActivePools).to.bignumber.eq(0);
            expect(epochEndedEvent.rewardsAvailable).to.bignumber.eq(0);
            expect(epochEndedEvent.totalFeesCollected).to.bignumber.eq(0);
            expect(epochEndedEvent.totalWeightedStake).to.bignumber.eq(0);
        });

        it('advances the epoch', async () => {
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const currentEpoch = await testContract.getCurrentEpoch.callAsync();
            expect(currentEpoch).to.be.bignumber.eq(INITIAL_EPOCH + 1);
        });

        it('immediately finalizes if there are no active pools', async () => {
            const receipt = await testContract.endEpoch.awaitTransactionSuccessAsync();
            const [epochFinalizedEvent] = filterLogsToArguments<IStakingEventsEpochFinalizedEventArgs>(
                receipt.logs,
                IStakingEventsEvents.EpochFinalized,
            );
            expect(epochFinalizedEvent.epoch).to.bignumber.eq(INITIAL_EPOCH);
            expect(epochFinalizedEvent.rewardsPaid).to.bignumber.eq(0);
            expect(epochFinalizedEvent.rewardsRemaining).to.bignumber.eq(0);
        });
    });
});
