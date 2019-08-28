import * as chai from 'chai';
import * as _ from 'lodash';

import {
    AnyRevertError,
    RawRevertError,
    RevertError,
    StringRevertError,
} from '../src/revert_error';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable: max-classes-per-file
class DescendantRevertError extends StringRevertError {
    public constructor(message: string) {
        super(message);
    }
}

class CustomRevertError extends RevertError {
    public constructor(message?: string) {
        super('CustomRevertError', 'CustomRevertError(string message)', { message });
    }
}

class ArrayRevertError extends RevertError {
    public constructor(strings?: string[]) {
        super('ArrayRevertError', 'ArrayRevertError(string[] strings)', { strings });
    }
}

class FixedSizeArrayRevertError extends RevertError {
    public constructor(strings?: string[]) {
        super('FixedArrayRevertError', 'FixedArrayRevertError(string[2] strings)', { strings });
    }
}

RevertError.registerType(CustomRevertError);

describe('RevertError', () => {
    describe('equality', () => {
        const message = 'foo';
        it('should equate two identical RevertErrors', () => {
            const revert1 = new StringRevertError(message);
            const revert2 = new StringRevertError(message);
            expect(revert1.equals(revert2)).to.be.true();
        });
        it('should equate two RevertErrors with missing fields', () => {
            const revert1 = new StringRevertError(message);
            const revert2 = new StringRevertError();
            expect(revert1.equals(revert2)).to.be.true();
        });
        it('should equate AnyRevertError with a real RevertError', () => {
            const revert1 = new StringRevertError(message);
            const revert2 = new AnyRevertError();
            expect(revert1.equals(revert2)).to.be.true();
        });
        it('should equate two revert errors with identical array fields', () => {
            const strings = ['foo', 'bar'];
            const revert1 = new ArrayRevertError(strings);
            const revert2 = new ArrayRevertError(strings);
            expect(revert1.equals(revert2)).to.be.true();
        });
        it('should not equate two revert errors with different sized array fields', () => {
            const strings = ['foo', 'bar'];
            const revert1 = new ArrayRevertError(strings);
            const revert2 = new ArrayRevertError(strings.slice(0, 1));
            expect(revert1.equals(revert2)).to.be.false();
        });
        it('should not equate two revert errors with different array field values', () => {
            const strings1 = ['foo', 'bar'];
            const strings2 = ['foo', 'baz'];
            const revert1 = new ArrayRevertError(strings1);
            const revert2 = new ArrayRevertError(strings2);
            expect(revert1.equals(revert2)).to.be.false();
        });
        it('should equate two revert errors with identical fixed-size array fields', () => {
            const strings = ['foo', 'bar'];
            const revert1 = new FixedSizeArrayRevertError(strings);
            const revert2 = new FixedSizeArrayRevertError(strings);
            expect(revert1.equals(revert2)).to.be.true();
        });
        it('should not equate two revert errors with different sized fixed-size array fields', () => {
            const strings = ['foo', 'bar'];
            const revert1 = new FixedSizeArrayRevertError(strings);
            const revert2 = new FixedSizeArrayRevertError(strings.slice(0, 1));
            expect(revert1.equals(revert2)).to.be.false();
        });
        it('should not equate two revert errors with the wrong sized fixed-size array fields', () => {
            const strings = ['foo', 'bar', 'baz'];
            const revert1 = new FixedSizeArrayRevertError(strings);
            const revert2 = new FixedSizeArrayRevertError(strings);
            expect(revert1.equals(revert2)).to.be.false();
        });
        it('should not equate two revert errors with different fixed-size array field values', () => {
            const strings1 = ['foo', 'bar'];
            const strings2 = ['foo', 'baz'];
            const revert1 = new FixedSizeArrayRevertError(strings1);
            const revert2 = new FixedSizeArrayRevertError(strings2);
            expect(revert1.equals(revert2)).to.be.false();
        });
        it('should not equate a the same RevertError type with different values', () => {
            const revert1 = new StringRevertError(message);
            const revert2 = new StringRevertError(`${message}1`);
            expect(revert1.equals(revert2)).to.be.false();
        });
        it('should not equate different RevertError types', () => {
            const revert1 = new StringRevertError(message);
            const revert2 = new DescendantRevertError(message);
            expect(revert1.equals(revert2)).to.be.false();
        });
        it('should equate two `RawRevertError` types with the same raw data', () => {
            const revert1 = new RawRevertError('0x0123456789');
            const revert2 = new RawRevertError(revert1.encode());
            expect(revert1.equals(revert2)).to.be.true();
        });
        it('should not equate two `RawRevertError` types with the different raw data', () => {
            const revert1 = new RawRevertError('0x0123456789');
            const revert2 = new RawRevertError(`${revert1.encode()}00`);
            expect(revert1.equals(revert2)).to.be.false();
        });
    });
    describe('registering', () => {
        it('should throw when registering an already registered signature', () => {
            class CustomRevertError2 extends RevertError {
                public constructor() {
                    super('CustomRevertError2', new CustomRevertError().signature, {});
                }
            }
            expect(() => RevertError.registerType(CustomRevertError2)).to.throw();
        });
    });
    describe('decoding', () => {
        // tslint:disable: prefer-template custom-no-magic-numbers
        const message = 'foobar';
        const encoded =
            '0x08c379a0' +
            '0000000000000000000000000000000000000000000000000000000000000020' +
            '0000000000000000000000000000000000000000000000000000000000000006' +
            Buffer.from(message).toString('hex') +
            _.repeat('00', 32 - 6);

        it('should decode an ABI encoded revert error', () => {
            const expected = new StringRevertError(message);
            const decoded = RevertError.decode(encoded);
            expect(decoded.equals(expected)).to.be.true();
        });
        it('should decode an unknown selector as a `RawRevertError`', () => {
            const _encoded = encoded.substr(0, 2) + '00' + encoded.substr(4);
            const decoded = RevertError.decode(_encoded);
            expect(decoded instanceof RawRevertError).to.be.true();
        });
        it('should fail to decode a malformed ABI encoded revert error', () => {
            const _encoded = encoded.substr(0, encoded.length - 1);
            const decode = () => RevertError.decode(_encoded);
            expect(decode).to.throw();
        });
    });
    describe('encoding', () => {
        const message = 'foobar';
        it('should be able to encode', () => {
            const expected =
                '0x08c379a0' +
                '0000000000000000000000000000000000000000000000000000000000000020' +
                '0000000000000000000000000000000000000000000000000000000000000006' +
                Buffer.from(message).toString('hex') +
                _.repeat('00', 32 - 6);
            const revert = new StringRevertError(message);
            expect(revert.encode()).to.equal(expected);
        });
        it('should throw if missing parameter values', () => {
            const revert = new StringRevertError();
            expect(() => revert.encode()).to.throw();
        });
    });
});
