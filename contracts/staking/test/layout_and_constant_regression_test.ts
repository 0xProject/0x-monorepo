import { blockchainTests } from '@0x/contracts-test-utils';

import { artifacts, TestStorageLayoutAndConstantsContract } from '../src';

blockchainTests('Storage Layout and Deployment Constants Regression Tests', env => {
    it('Should successfully deploy the staking contract after running the layout and regression test', async () => {
        await TestStorageLayoutAndConstantsContract.deployFrom0xArtifactAsync(
            artifacts.TestStorageLayoutAndConstants,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });
});
