import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import 'mocha';

import { Request, RequestHandler, TradingClient } from '../src/index';

chai.config.includeStack = true;
chai.use(dirtyChai);
const expect = chai.expect;
const assert = chai.assert;

class MockHandler implements RequestHandler {
    public canHandleResult: boolean;
    public success: string;
    public failure: string;
    constructor(canHandle: boolean, success: string, failure: string) {
        this.canHandleResult = canHandle;
        this.success = success;
        this.failure = failure;
    }

    public canHandle(request: Request): boolean {
        return this.canHandleResult;
    }

    public handle(request: Request): string {
        if (request.methodName === 'success') {
            return this.success;
        } else {
            throw new Error(this.failure);
        }
    }
}
const alwaysTrueHandler = new MockHandler(true, 'always true success', 'always true handling error');
const alwaysFalseHandler = new MockHandler(false, 'always false success', 'always false handling error');

describe('TradingClient', () => {
    it('should use a handler', () => {
        const client = new TradingClient([alwaysTrueHandler, alwaysFalseHandler]);
        const request = {
            methodName: 'success',
            arguments: ['one', 'two', { a: 1, b: 2 }],
        };
        assert.doesNotThrow(() => client.handle(request));
        assert.equal(client.handle(request), 'always true success');
    });
    it('should error when there are no handlers', () => {
        const client = new TradingClient([alwaysFalseHandler, alwaysFalseHandler]);
        const request = {
            methodName: 'success',
            arguments: ['one', 'two', { a: 1, b: 2 }],
        };
        assert.throws(() => client.handle(request), 'Could not find any handlers');
    });
    it('should relay error msg from a handler', () => {
        const client = new TradingClient([alwaysTrueHandler, alwaysFalseHandler]);
        const request = {
            methodName: 'failure',
            arguments: ['one', 'two', { a: 1, b: 2 }],
        };
        assert.throws(() => client.handle(request), 'always true handling error');
    });
});
