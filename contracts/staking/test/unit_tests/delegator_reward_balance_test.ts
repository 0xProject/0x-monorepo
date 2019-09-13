import { blockchainTests, expect, Numberish } from '@0x/contracts-test-utils';

import { artifacts, TestDelegatorRewardsContract } from '../../src';

blockchainTests('delegator rewards', env => {
    let testContract: TestDelegatorRewardsContract;

    before(async () => {
        testContract = await TestDelegatorRewardsContract.deployFrom0xArtifactAsync(
            artifacts.TestDelegatorRewards,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    describe('computeRewardBalanceOfDelegator()', () => {
        it('does stuff', () => {
            // TODO
        });
    });
});
