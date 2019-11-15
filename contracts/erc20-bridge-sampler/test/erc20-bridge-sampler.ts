import { blockchainTests, expect, getRandomInteger } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { artifacts } from './artifacts';
import { TestERC20BridgeSamplerContract } from './wrappers';

blockchainTests('erc20-bridge-sampler', env => {
    let testContract: TestERC20BridgeSamplerContract;

    before(async () => {
        testContract = await TestERC20BridgeSamplerContract.deployFrom0xArtifactAsync(
            artifacts.TestERC20BridgeSampler,
            env.provider,
            env.txDefaults,
            {},
        );
    });

    describe('queryOrders()', () => {
        it('returns the results of `getOrderInfo()` for each order', async () => {

        });
    });
});
