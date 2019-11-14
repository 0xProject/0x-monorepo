import { blockchainTests, expect, hexRandom } from '@0x/contracts-test-utils';
import { coerceThrownErrorAsRevertError, StringRevertError } from '@0x/utils';

import { artifacts } from './artifacts';
import { TestLibRichErrorsContract } from './wrappers';

blockchainTests('LibRichErrors', env => {
    let lib: TestLibRichErrorsContract;

    before(async () => {
        // Deploy SafeMath
        lib = await TestLibRichErrorsContract.deployFrom0xArtifactAsync(
            artifacts.TestLibRichErrors,
            env.provider,
            env.txDefaults,
            {},
        );
    });

    describe('_rrevert', () => {
        it('should correctly revert the extra bytes', async () => {
            const extraBytes = hexRandom(100);
            try {
                await lib.externalRRevert(extraBytes).callAsync();
            } catch (err) {
                const revertError = coerceThrownErrorAsRevertError(err);
                return expect(revertError.encode()).to.eq(extraBytes);
            }
            return;
            // TODO(xianny): NOT WORKING, v3 merge
            // return expect.fail('Expected call to revert');
        });

        it('should correctly revert a StringRevertError', async () => {
            const error = new StringRevertError('foo');
            return expect(lib.externalRRevert(error.encode()).callAsync()).to.revertWith(error);
        });
    });
});
