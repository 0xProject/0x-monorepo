import { JSONRPCResponsePayload } from '@0xproject/types';
import * as chai from 'chai';
import * as _ from 'lodash';
import Web3 = require('web3');
import Web3ProviderEngine = require('web3-provider-engine');
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

import { RedundantRPCSubprovider } from '../../src';
import { DoneCallback } from '../../src/types';
import { chaiSetup } from '../chai_setup';
import { ganacheSubprovider } from '../utils/ganache_subprovider';
import { reportCallbackErrors } from '../utils/report_callback_errors';

const expect = chai.expect;
chaiSetup.configure();

describe('RedundantRpcSubprovider', () => {
    let provider: Web3ProviderEngine;
    it('succeeds when supplied a healthy endpoint', (done: DoneCallback) => {
        provider = new Web3ProviderEngine();
        const endpoints = ['http://localhost:8545'];
        const redundantSubprovider = new RedundantRPCSubprovider(endpoints);
        // Hack: Hot-swap rpc with ganacheSubprovider
        (redundantSubprovider as any)._rpcs = [ganacheSubprovider];
        provider.addProvider(redundantSubprovider);
        provider.start();

        const payload = {
            jsonrpc: '2.0',
            method: 'eth_accounts',
            params: [],
            id: 1,
        };
        const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
            expect(err).to.be.a('null');
            expect(response.result.length).to.be.equal(10);
            done();
        });
        provider.sendAsync(payload, callback);
    });
    it('succeeds when supplied at least one healthy endpoint', (done: DoneCallback) => {
        provider = new Web3ProviderEngine();
        const endpoints = ['http://does-not-exist:3000', 'http://localhost:8545'];
        const redundantSubprovider = new RedundantRPCSubprovider(endpoints);
        // Hack: Hot-swap rpcs with [nonExistentSubprovider, ganacheSubprovider]
        const nonExistentSubprovider = new RpcSubprovider({
            rpcUrl: 'http://does-not-exist:3000',
        });
        (redundantSubprovider as any)._rpcs = [nonExistentSubprovider, ganacheSubprovider];
        provider.addProvider(redundantSubprovider);
        provider.start();

        const payload = {
            jsonrpc: '2.0',
            method: 'eth_accounts',
            params: [],
            id: 1,
        };
        const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
            expect(err).to.be.a('null');
            expect(response.result.length).to.be.equal(10);
            done();
        });
        provider.sendAsync(payload, callback);
    });
});
