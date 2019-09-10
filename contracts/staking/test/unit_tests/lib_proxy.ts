import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';

import { artifacts, TestLibProxyContract } from '../../src';

enum RevertRule {
    RevertOnError,
    AlwaysRevert,
    NeverRevert,
}

blockchainTests.resets('LibProxy', env => {
    let proxy: TestLibProxyContract;

    before(async () => {
        proxy = await TestLibProxyContract.deployFrom0xArtifactAsync(
            artifacts.TestLibProxy,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    describe('proxyCall', () => {
        it('should revert when the destination is address zero and the revert rule is `AlwaysRevert`', async () => {
            const expectedError = new StakingRevertErrors.ProxyDestinationCannotBeNilError();
            const tx = proxy.externalProxyCall.awaitTransactionSuccessAsync(
                constants.NULL_ADDRESS,
                RevertRule.AlwaysRevert,
            );
            return expect(tx).to.revertWith(expectedError);
        });

        describe('REVERT_ON_ERROR', () => {});

        describe('ALWAYS_REVERT', () => {});

        describe('NEVER_REVERT', () => {});
    });
});
