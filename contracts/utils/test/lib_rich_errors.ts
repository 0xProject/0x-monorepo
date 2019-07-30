import { chaiSetup, constants, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { StringRevertError } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { artifacts, TestLibRichErrorsContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('LibEIP712', () => {
    let lib: TestLibRichErrorsContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
        // Deploy SafeMath
        lib = await TestLibRichErrorsContract.deployFrom0xArtifactAsync(
            artifacts.TestLibRichErrors,
            provider,
            txDefaults,
        );
    });

    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('_rrevert', () => {
        it('should correctly revert the extra bytes', async () => {
            return expect(lib.externalRRevert.callAsync(constants.NULL_BYTES)).to.revertWith(constants.NULL_BYTES);
        });

        it('should correctly revert a StringRevertError', async () => {
            const error = new StringRevertError('foo');
            return expect(lib.externalRRevert.callAsync(error.encode())).to.revertWith(error);
        });
    });
});
