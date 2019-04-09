import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import 'mocha';

import { Request, RequestHandler, TradingClient } from '../src/index';

chai.config.includeStack = true;
chai.use(dirtyChai);
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

    public async handleAsync(request: Request): Promise<string> {
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
    it('should use a handler', async () => {
        const client = new TradingClient([alwaysTrueHandler, alwaysFalseHandler]);
        const request = {
            methodName: 'success',
            arguments: ['one', 'two', { a: 1, b: 2 }],
        };

        assert.doesNotThrow(async () => client.handleAsync(request));

        const result = await client.handleAsync(request);
        assert.equal(result, 'always true success');
    });
    it('should error when there are no handlers', () => {
        const client = new TradingClient([alwaysFalseHandler, alwaysFalseHandler]);
        const request = {
            methodName: 'success',
            arguments: ['one', 'two', { a: 1, b: 2 }],
        };
        assert.throws(async () => client.handleAsync(request), 'Could not find any handlers');
    });
    it('should relay error msg from a handler', () => {
        const client = new TradingClient([alwaysTrueHandler, alwaysFalseHandler]);
        const request = {
            methodName: 'failure',
            arguments: ['one', 'two', { a: 1, b: 2 }],
        };
        assert.throws(async () => client.handleAsync(request), 'always true handling error');
    });
});
