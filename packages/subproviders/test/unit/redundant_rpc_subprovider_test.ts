import { DoneCallback } from '@0xproject/types';
import * as chai from 'chai';
import { JSONRPCResponsePayload } from 'ethereum-types';
import * as _ from 'lodash';
import 'make-promises-safe';
import Web3 = require('web3');
import Web3ProviderEngine = require('web3-provider-engine');
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

import { RedundantSubprovider } from '../../src';
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
        provider.start();

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
        const nonExistentSubprovider = new RpcSubprovider({
            rpcUrl: 'http://does-not-exist:3000',
        });
        const subproviders = [nonExistentSubprovider as Subprovider, ganacheSubprovider];
        const redundantSubprovider = new RedundantSubprovider(subproviders);
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
            expect(response.result.length).to.be.equal(DEFAULT_NUM_ACCOUNTS);
            done();
        });
        provider.sendAsync(payload, callback);
    });
});
