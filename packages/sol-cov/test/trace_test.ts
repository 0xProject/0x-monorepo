import * as chai from 'chai';
import { OpCode, StructLog } from 'ethereum-types';
import * as _ from 'lodash';
import 'mocha';

import { getTracesByContractAddress } from '../src/trace';

const expect = chai.expect;

const DEFAULT_STRUCT_LOG: StructLog = {
    depth: 0,
    error: '',
    gas: 0,
    gasCost: 0,
    memory: [],
    op: OpCode.Invalid,
    pc: 0,
    stack: [],
    storage: {},
};

function addDefaultStructLogFields(compactStructLog: Partial<StructLog> & { op: OpCode; depth: number }): StructLog {
    return { ...DEFAULT_STRUCT_LOG, ...compactStructLog };
}

describe('Trace', () => {
    describe('#getTracesByContractAddress', () => {
        it('correctly splits trace by contract address', () => {
            const delegateCallAddress = '0x0000000000000000000000000000000000000002';
            const trace = [
                {
                    op: OpCode.DelegateCall,
                    stack: [delegateCallAddress, '0x'],
                    depth: 0,
                },
                {
                    op: OpCode.Return,
                    depth: 1,
                },
                {
                    op: OpCode.Return,
                    depth: 0,
                },
            ];
            const fullTrace = _.map(trace, compactStructLog => addDefaultStructLogFields(compactStructLog));
            const startAddress = '0x0000000000000000000000000000000000000001';
            const traceByContractAddress = getTracesByContractAddress(fullTrace, startAddress);
            const expectedTraceByContractAddress = {
                [startAddress]: [fullTrace[0], fullTrace[2]],
                [delegateCallAddress]: [fullTrace[1]],
            };
            expect(traceByContractAddress).to.be.deep.equal(expectedTraceByContractAddress);
        });
    });
});
