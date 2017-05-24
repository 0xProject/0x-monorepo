import {ZeroEx} from '../src/ts/0x.js';
import {expect} from 'chai';
import 'mocha';

describe('ZeroEx library', () => {
    describe('#verifySignature', () => {
        it('should return undefined', () => {
            const zeroEx = new ZeroEx();
            expect(zeroEx.verifySignature()).to.be.undefined;
        });
    });
});
