import { DoneCallback } from '@0x/types';
import { providerUtils } from '@0x/utils';
import * as chai from 'chai';
import { JSONRPCResponsePayload } from 'ethereum-types';
import * as Sinon from 'sinon';

import { RedundantSubprovider, RPCSubprovider, Web3ProviderEngine } from '../../src';
import { Subprovider } from '../../src/subproviders/subprovider';
import { chaiSetup } from '../chai_setup';
import { ganacheSubprovider } from '../utils/ganache_subprovider';
import { reportCallbackErrors } from '../utils/report_callback_errors';

const expect = chai.expect;
chaiSetup.configure();
const DEFAULT_NUM_ACCOUNTS = 10;

describe('RedundantSubprovider', () => {
    let provider: Web3ProviderEngine;
    it('succeeds when supplied a healthy endpoint', (done: DoneCallback) => {
        provider = new Web3ProviderEngine();
        const subproviders = [ganacheSubprovider];
        const redundantSubprovider = new RedundantSubprovider(subproviders);
        provider.addProvider(redundantSubprovider);
        providerUtils.startProviderEngine(provider);

        const payload = {
            jsonrpc: '2.0',
            method: 'eth_accounts',
            params: [],
            id: 1,
        };
        const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
            expect(err).to.be.a('null');
            expect(response.result.length).to.be.equal(DEFAULT_NUM_ACCOUNTS);
            done();
        });
        provider.sendAsync(payload, callback);
    });
    it('succeeds when supplied at least one healthy endpoint', (done: DoneCallback) => {
        provider = new Web3ProviderEngine();
        const nonExistentSubprovider = new RPCSubprovider('http://does-not-exist:3000');
        const handleRequestStub = Sinon.stub(nonExistentSubprovider, 'handleRequest').throws(
            new Error('REQUEST_FAILED'),
        );
        const subproviders = [nonExistentSubprovider as Subprovider, ganacheSubprovider];
        const redundantSubprovider = new RedundantSubprovider(subproviders);
        provider.addProvider(redundantSubprovider);
        providerUtils.startProviderEngine(provider);

        const payload = {
            jsonrpc: '2.0',
            method: 'eth_accounts',
            params: [],
            id: 1,
        };
        const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
            expect(err).to.be.a('null');
            expect(response.result.length).to.be.equal(DEFAULT_NUM_ACCOUNTS);
            handleRequestStub.restore();
            done();
        });
        provider.sendAsync(payload, callback);
    });
});
