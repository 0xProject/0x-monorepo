import { StandardError } from '@0x/utils';
import * as chai from 'chai';

import { chaiSetup } from '../src';

chaiSetup.configure();
const expect = chai.expect;

class CustomError extends StandardError {
    constructor(msg: string) {
        super(msg);
    }
}

describe('Chai tests', () => {
    describe('RichRevertReasons', () => {
        describe('#equal', () => {
            it('should equate two identical RichRevertReasons', () => {
                const message = 'foo';
                const reason1 = new StandardError(message);
                const reason2 = new StandardError(message);
                expect(reason1).is.equal(reason2);
            });
            it('should equate two RichRevertReasons where one has missing fields', () => {
                const reason1 = new StandardError('foo');
                const reason2 = new StandardError();
                expect(reason1).is.equal(reason2);
            });
            it('should not equate two RichRevertReasons with diferent fields', () => {
                const reason1 = new StandardError('foo1');
                const reason2 = new StandardError('foo2');
                expect(reason1).is.not.equal(reason2);
            });
            it('should not equate two RichRevertReasons with diferent types', () => {
                const message = 'foo';
                const reason1 = new StandardError(message);
                const reason2 = new CustomError(message);
                expect(reason1).is.not.equal(reason2);
            });
            it('should equate a StandardError to a string equal to message', () => {
                const message = 'foo';
                const reason = new StandardError(message);
                expect(message).is.equal(reason);
            });
            it('should equate an Error to a StandardError with an equal message', () => {
                const message = 'foo';
                const reason = new StandardError(message);
                const error = new Error(message);
                expect(error).is.equal(reason);
            });
            it('should equate a string to a StandardError with the same message', () => {
                const message = 'foo';
                const reason = new StandardError(message);
                expect(reason).is.equal(message);
            });
            it('should not equate a StandardError to a string not equal to message', () => {
                const reason = new StandardError('foo1');
                expect('foo2').is.not.equal(reason);
            });
            it('should not equate a string to a StandardError with a different message', () => {
                const reason = new StandardError('foo1');
                expect(reason).is.not.equal('foo2');
            });
            it('should not equate an Error to a StandardError with a different message', () => {
                const reason = new StandardError('foo1');
                const error = new Error('foo2');
                expect(error).is.not.equal(reason);
            });
        });
        describe('#rejectedWith', () => {
            it('should equate a promise that rejects to an identical RichRevertReasons', async () => {
                const message = 'foo';
                const reason1 = new StandardError(message);
                const reason2 = new StandardError(message);
                const promise = (async () => {
                    throw reason1;
                })();
                return expect(promise).to.be.rejectedWith(reason2);
            });
            it('should not equate a promise that rejects to a StandardError with a different messages', async () => {
                const reason1 = new StandardError('foo1');
                const reason2 = new StandardError('foo2');
                const promise = (async () => {
                    throw reason1;
                })();
                return expect(promise).to.not.be.rejectedWith(reason2);
            });
            it('should not equate a promise that rejects to different RichRevertReason types', async () => {
                const message = 'foo';
                const reason1 = new StandardError(message);
                const reason2 = new CustomError(message);
                const promise = (async () => {
                    throw reason1;
                })();
                return expect(promise).to.not.be.rejectedWith(reason2);
            });
        });
        describe('#become', () => {
            it('should equate a promise that resolves to an identical RichRevertReasons', async () => {
                const message = 'foo';
                const reason1 = new StandardError(message);
                const reason2 = new StandardError(message);
                const promise = (async () => reason1)();
                return expect(promise).to.become(reason2);
            });
            it('should not equate a promise that resolves to a StandardError with a different messages', async () => {
                const reason1 = new StandardError('foo1');
                const reason2 = new StandardError('foo2');
                const promise = (async () => reason1)();
                return expect(promise).to.not.become(reason2);
            });
            it('should not equate a promise that resolves to different RichRevertReason types', async () => {
                const message = 'foo';
                const reason1 = new StandardError(message);
                const reason2 = new CustomError(message);
                const promise = (async () => reason1)();
                return expect(promise).to.not.become(reason2);
            });
        });
    });
});
