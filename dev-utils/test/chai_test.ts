import { StringRevertError } from '@0x/utils';
import * as chai from 'chai';

import { chaiSetup } from '../src';

chaiSetup.configure();
const expect = chai.expect;

class DescendantRevertError extends StringRevertError {
    constructor(msg: string) {
        super(msg);
    }
}

describe('Chai tests', () => {
    describe('RevertErrors', () => {
        describe('#equal', () => {
            it('should equate two identical RevertErrors', () => {
                const message = 'foo';
                const revert1 = new StringRevertError(message);
                const revert2 = new StringRevertError(message);
                expect(revert1).is.equal(revert2);
            });
            it('should equate two RevertErrors where one has missing fields', () => {
                const revert1 = new StringRevertError('foo');
                const revert2 = new StringRevertError();
                expect(revert1).is.equal(revert2);
            });
            it('should not equate two RevertErrors with diferent fields', () => {
                const revert1 = new StringRevertError('foo1');
                const revert2 = new StringRevertError('foo2');
                expect(revert1).is.not.equal(revert2);
            });
            it('should not equate two RevertErrors with diferent types', () => {
                const message = 'foo';
                const revert1 = new StringRevertError(message);
                const revert2 = new DescendantRevertError(message);
                expect(revert1).is.not.equal(revert2);
            });
            it('should equate a StringRevertError to a string equal to message', () => {
                const message = 'foo';
                const revert = new StringRevertError(message);
                expect(message).is.equal(revert);
            });
            it('should equate an Error to a StringRevertError with an equal message', () => {
                const message = 'foo';
                const revert = new StringRevertError(message);
                const error = new Error(message);
                expect(error).is.equal(revert);
            });
            it('should equate a ganache transaction revert error with reason to a StringRevertError with an equal message', () => {
                const message = 'foo';
                const error: any = new Error(`VM Exception while processing transaction: revert ${message}`);
                error.hashes = ['0x1'];
                error.results = { '0x1': { error: 'revert', program_counter: 1, return: '0x', reason: message } };
                const revert = new StringRevertError(message);
                expect(error).is.equal(revert);
            });
            it('should equate a ganache transaction revert error with return data to a StringRevertError with an equal message', () => {
                const error: any = new Error(`VM Exception while processing transaction: revert`);
                error.hashes = ['0x1'];
                // Encoding for `Error(string message='foo')`
                const returnData =
                    '0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000003666f6f0000000000000000000000000000000000000000000000000000000000';
                error.results = {
                    '0x1': { error: 'revert', program_counter: 1, return: returnData, reason: undefined },
                };
                const revert = new StringRevertError('foo');
                expect(error).is.equal(revert);
            });
            it('should not equate a ganache transaction revert error with reason to a StringRevertError with a different message', () => {
                const message = 'foo';
                const error: any = new Error(`VM Exception while processing transaction: revert ${message}`);
                error.hashes = ['0x1'];
                error.results = { '0x1': { error: 'revert', program_counter: 1, return: '0x', reason: message } };
                const revert = new StringRevertError('boo');
                expect(error).is.not.equal(revert);
            });
            it('should not equate a ganache transaction revert error with return data to a StringRevertError with a different message', () => {
                const error: any = new Error(`VM Exception while processing transaction: revert`);
                error.hashes = ['0x1'];
                // Encoding for `Error(string message='foo')`
                const returnData =
                    '0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000003666f6f0000000000000000000000000000000000000000000000000000000000';
                error.results = {
                    '0x1': { error: 'revert', program_counter: 1, return: returnData, reason: undefined },
                };
                const revert = new StringRevertError('boo');
                expect(error).is.not.equal(revert);
            });
            it('should equate an opaque geth transaction revert error to any RevertError', () => {
                const error = new Error(`always failing transaction`);
                const revert = new StringRevertError('foo');
                expect(error).is.equal(revert);
            });
            it('should equate a string to a StringRevertError with the same message', () => {
                const message = 'foo';
                const revert = new StringRevertError(message);
                expect(revert).is.equal(message);
            });
            it('should not equate a StringRevertError to a string not equal to message', () => {
                const revert = new StringRevertError('foo1');
                expect('foo2').is.not.equal(revert);
            });
            it('should not equate a string to a StringRevertError with a different message', () => {
                const revert = new StringRevertError('foo1');
                expect(revert).is.not.equal('foo2');
            });
            it('should not equate an Error to a StringRevertError with a different message', () => {
                const revert = new StringRevertError('foo1');
                const error = new Error('foo2');
                expect(error).is.not.equal(revert);
            });
        });
        describe('#revertWith', () => {
            it('should equate a promise that rejects to identical RevertErrors', async () => {
                const message = 'foo';
                const revert1 = new StringRevertError(message);
                const revert2 = new StringRevertError(message);
                const promise = (async () => {
                    throw revert1;
                })();
                return expect(promise).to.revertWith(revert2);
            });
            it('should not equate a promise that rejects to a StringRevertError with a different messages', async () => {
                const revert1 = new StringRevertError('foo1');
                const revert2 = new StringRevertError('foo2');
                const promise = (async () => {
                    throw revert1;
                })();
                return expect(promise).to.not.revertWith(revert2);
            });
            it('should not equate a promise that rejects to different RevertError types', async () => {
                const message = 'foo';
                const revert1 = new StringRevertError(message);
                const revert2 = new DescendantRevertError(message);
                const promise = (async () => {
                    throw revert1;
                })();
                return expect(promise).to.not.revertWith(revert2);
            });
        });
        describe('#become', () => {
            it('should equate a promise that resolves to an identical RevertErrors', async () => {
                const message = 'foo';
                const revert1 = new StringRevertError(message);
                const revert2 = new StringRevertError(message);
                const promise = (async () => revert1)();
                return expect(promise).to.become(revert2);
            });
            it('should not equate a promise that resolves to a StringRevertError with a different messages', async () => {
                const revert1 = new StringRevertError('foo1');
                const revert2 = new StringRevertError('foo2');
                const promise = (async () => revert1)();
                return expect(promise).to.not.become(revert2);
            });
            it('should not equate a promise that resolves to different RevertError types', async () => {
                const message = 'foo';
                const revert1 = new StringRevertError(message);
                const revert2 = new DescendantRevertError(message);
                const promise = (async () => revert1)();
                return expect(promise).to.not.become(revert2);
            });
        });
        // TODO: Remove these tests when we no longer coerce `Error` types to `StringRevertError` types
        // for backwards compatibility.
        describe('#rejectedWith (backwards compatibility)', () => {
            it('should equate a promise that rejects with an Error to a string of the same message', async () => {
                const message = 'foo';
                const revert1 = new Error(message);
                const promise = (async () => {
                    throw revert1;
                })();
                return expect(promise).to.rejectedWith(message);
            });
            it('should equate a promise that rejects with an StringRevertErrors to a string of the same message', async () => {
                const message = 'foo';
                const revert = new StringRevertError(message);
                const promise = (async () => {
                    throw revert;
                })();
                return expect(promise).to.rejectedWith(message);
            });
            it('should not equate a promise that rejects with an StringRevertErrors to a string with different messages', async () => {
                const revert = new StringRevertError('foo1');
                const promise = (async () => {
                    throw revert;
                })();
                return expect(promise).to.not.be.rejectedWith('foo2');
            });
        });
    });
});
