import * as chai from 'chai';
import 'mocha';

import { constants } from '../src/constants';
import { getPcToInstructionIndexMapping } from '../src/instructions';

const expect = chai.expect;

describe('instructions', () => {
    describe('#getPcToInstructionIndexMapping', () => {
        it('correctly maps pcs to instruction indexed', () => {
            // tslint:disable-next-line:custom-no-magic-numbers
            const bytecode = new Uint8Array([constants.PUSH1, 42, constants.PUSH2, 1, 2, constants.TIMESTAMP]);
            const pcToInstruction = getPcToInstructionIndexMapping(bytecode);
            const expectedPcToInstruction = { '0': 0, '2': 1, '5': 2 };
            expect(pcToInstruction).to.be.deep.equal(expectedPcToInstruction);
        });
    });
});
