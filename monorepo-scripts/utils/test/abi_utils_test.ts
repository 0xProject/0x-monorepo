import * as chai from 'chai';
import 'mocha';

import { abiUtils } from '../src';

const expect = chai.expect;

describe('abiUtils', () => {
    describe('splitTupleTypes', () => {
        it('handles basic types', () => {
            const got = abiUtils.splitTupleTypes('tuple(bytes,uint256,address)');
            expect(got).to.deep.equal(['bytes', 'uint256', 'address']);
        });
        it('handles nested tuple types', () => {
            const got = abiUtils.splitTupleTypes('tuple(tuple(bytes,uint256),address)');
            expect(got).to.deep.equal(['tuple(bytes,uint256)', 'address']);
        });
    });
});
