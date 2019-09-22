import { chaiSetup, constants, getCodesizeFromArtifact } from '@0x/contracts-test-utils';
import * as chai from 'chai';

chaiSetup.configure();
const expect = chai.expect;

import { artifacts } from '../src';

describe('Contract Size Checks', () => {
    describe('Exchange', () => {
        it('should have a codesize less than the maximum', async () => {
            const actualSize = getCodesizeFromArtifact(artifacts.Exchange);
            expect(actualSize).to.be.lt(constants.MAX_CODE_SIZE);
        });
    });
});
