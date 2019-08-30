import { blockchainTests, expect, hexRandom } from '@0x/contracts-test-utils';
import { coerceThrownErrorAsRevertError, StringRevertError } from '@0x/utils';

import { artifacts, TestLibRichErrorsContract } from '../src';

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
                await lib.externalRRevert.callAsync(extraBytes);
            } catch (err) {
                const revertError = coerceThrownErrorAsRevertError(err);
                return expect(revertError.encode()).to.eq(extraBytes);
            }
            return expect.fail('Expected call to revert');
        });

        it('should correctly revert a StringRevertError', async () => {
            const error = new StringRevertError('foo');
            return expect(lib.externalRRevert.callAsync(error.encode())).to.revertWith(error);
        });
    });
});
