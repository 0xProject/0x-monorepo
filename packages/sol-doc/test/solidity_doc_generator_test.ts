import * as chai from 'chai';
import 'mocha';

import { SolidityDocGenerator } from '../src/solidity_doc_generator';

import { chaiSetup } from './util/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('#SolidityDocGenerator', () => {
    it('should generate', async () => {
        const generator = new SolidityDocGenerator(`${__dirname}/../../test/fixtures/contracts`);

        const doc = await generator.generateAsync(['TokenTransferProxy']);

        expect(doc).to.not.be.undefined();
    });
});
