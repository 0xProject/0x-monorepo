import { blockchainTests } from '@0x/contracts-test-utils';

import { artifacts } from './artifacts';
import { TestStorageLayoutAndConstantsContract } from './wrappers';

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
