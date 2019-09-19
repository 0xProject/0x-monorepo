import { blockchainTests, expect } from '@0x/contracts-test-utils';

import { artifacts, TestStorageLayoutContract } from '../src';

blockchainTests.resets('Storage layout tests', env => {
    let testStorageLayoutContract: TestStorageLayoutContract;
    before(async () => {
        testStorageLayoutContract = await TestStorageLayoutContract.deployFrom0xArtifactAsync(
            artifacts.TestStorageLayout,
            env.provider,
            env.txDefaults,
            {},
        );
    });

    it('should have the correct storage slots', async () => {
        return expect(testStorageLayoutContract.assertExpectedStorageLayout.callAsync()).to.be.fulfilled('');
    });
});
