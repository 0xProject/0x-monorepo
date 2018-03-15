import * as chai from 'chai';
import * as fs from 'fs';
import 'mocha';
import * as path from 'path';

import { getPcToInstructionIndexMapping } from '../src/instructions';

const expect = chai.expect;

describe('instructions', () => {
    describe('#getPcToInstructionIndexMapping', () => {
        it('correctly maps pcs to instruction indexed', () => {
            const PUSH1 = 0x60;
            const PUSH2 = 0x61;
            const TIMESTAMP = 0x42;
            const bytecode = new Uint8Array([PUSH1, 42, PUSH2, 1, 2, TIMESTAMP]);
            const pcToInstruction = getPcToInstructionIndexMapping(bytecode);
            const expectedPcToInstruction = { '0': 0, '2': 1, '5': 2 };
            expect(pcToInstruction).to.be.deep.equal(expectedPcToInstruction);
        });
    });
});
