import { blockchainTests, expect, Numberish } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';

import { StoredBalance } from '../utils/types';

import {
    artifacts,
    TestMixinStakingPoolRewardsContract,
    TestMixinStakingPoolRewardsEvents,
    TestMixinStakingPoolRewardsUpdateCumulativeRewardEventArgs as UpdateCumulativeReward,
} from '../../src';
import { constants } from '../utils/constants';

blockchainTests.resets.only('MixinStakingPoolRewards unit tests', env => {
    let testContract: TestMixinStakingPoolRewardsContract;

    const INITIAL_EPOCH = 0;
    const NEXT_EPOCH = 1;

    before(async () => {
        testContract = await TestMixinStakingPoolRewardsContract.deployFrom0xArtifactAsync(
            artifacts.TestMixinStakingPoolRewards,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    describe('withdrawAndSyncDelegatorRewards()', () => {
        it('poop', async () => {
            // no-op
        });
    });
});
