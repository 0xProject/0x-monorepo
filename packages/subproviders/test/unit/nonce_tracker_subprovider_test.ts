import * as chai from 'chai';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import Web3ProviderEngine = require('web3-provider-engine');
import FixtureSubprovider = require('web3-provider-engine/subproviders/fixture');

import { promisify } from '@0xproject/utils';
import EthereumTx = require('ethereumjs-tx');

import { NonceTrackerSubprovider } from '../../src';
import { chaiSetup } from '../chai_setup';

const expect = chai.expect;
chaiSetup.configure();

describe('NonceTrackerSubprovider', () => {
    let provider: Web3ProviderEngine;
    const getTransactionCountPayload = {
        jsonrpc: '2.0',
        method: 'eth_getTransactionCount',
        params: ['0x0', 'pending'],
        id: 1,
    };
    const sendTransactionPayload = {
        jsonrpc: '2.0',
        method: 'eth_sendRawTransaction',
        params: [],
        id: 1,
    };
    const txParams = [
        '0x',
        '0x09184e72a000',
        '0x2710',
        '0x0000000000000000000000000000000000000000',
        '0x',
        '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
        '0x1c',
        '0x5e1d3a76fbf824220eafc8c79ad578ad2b67d01b0c2425eb1f1347e8f50882ab',
        '0x5bd428537f05f9830e93792f90ea6a3e2d1ee84952dd96edbae9f658f831ab13',
    ];
    function createFixtureSubprovider(): FixtureSubprovider {
        let isFirstGetTransactionCount = true;
        const fixedBlockNumberAndTransactionCountProvider = new FixtureSubprovider({
            eth_getBlockByNumber: '0x01',
            eth_getTransactionCount: (data: any, next: any, end: any) => {
                // For testing caching we return different results on the second call
                if (isFirstGetTransactionCount) {
                    isFirstGetTransactionCount = false;
                    end(null, '0x00');
                } else {
                    end(null, '0x99');
                }
            },
        });
        return fixedBlockNumberAndTransactionCountProvider;
    }
    it('successfully caches the transaction count', async () => {
        provider = new Web3ProviderEngine();
        const nonceTrackerSubprovider = new NonceTrackerSubprovider();
        provider.addProvider(nonceTrackerSubprovider);
        provider.addProvider(createFixtureSubprovider());
        provider.start();

        const payload = { ...getTransactionCountPayload, params: ['0x0', 'pending'] };

        const response = await promisify<any>(provider.sendAsync, provider)(payload);
        expect(response.result).to.be.eq('0x00');
        const secondResponse = await promisify<any>(provider.sendAsync, provider)(payload);
        expect(secondResponse.result).to.be.eq('0x00');
    });
    it('does not cache the result for latest transaction count', async () => {
        provider = new Web3ProviderEngine();
        const nonceTrackerSubprovider = new NonceTrackerSubprovider();
        provider.addProvider(nonceTrackerSubprovider);
        provider.addProvider(createFixtureSubprovider());
        provider.start();

        const payload = { ...getTransactionCountPayload, params: ['0x0', 'latest'] };

        const response = await promisify<any>(provider.sendAsync, provider)(payload);
        expect(response.result).to.be.eq('0x00');
        const secondResponse = await promisify<any>(provider.sendAsync, provider)(payload);
        expect(secondResponse.result).to.be.eq('0x99');
    });
    it('clears the cache on a Nonce Too Low Error', async () => {
        provider = new Web3ProviderEngine();
        const nonceTrackerSubprovider = new NonceTrackerSubprovider();
        provider.addProvider(nonceTrackerSubprovider);
        provider.addProvider(createFixtureSubprovider());
        provider.addProvider(
            new FixtureSubprovider({
                eth_sendRawTransaction: (data: any, next: any, end: any) => {
                    end(new Error('Transaction nonce is too low'));
                },
            }),
        );
        provider.start();

        const noncePayload = {
            ...getTransactionCountPayload,
            params: ['0x1f36f546477cda21bf2296c50976f2740247906f', 'pending'],
        };
        const transaction = new EthereumTx(txParams);
        const txPayload = {
            ...sendTransactionPayload,
            params: [transaction.serialize()],
        };

        const response = await promisify<any>(provider.sendAsync, provider)(noncePayload);
        expect(response.result).to.be.eq('0x00');
        const secondResponse = await promisify<any>(provider.sendAsync, provider)(noncePayload);
        expect(secondResponse.result).to.be.eq('0x00');
        try {
            await promisify(provider.sendAsync, provider)(txPayload);
        } catch (err) {
            const thirdResponse = await promisify<any>(provider.sendAsync, provider)(noncePayload);
            expect(thirdResponse.result).to.be.eq('0x99');
        }
    });
    it('increments the used nonce when a transaction successfully submits', async () => {
        provider = new Web3ProviderEngine();
        const nonceTrackerSubprovider = new NonceTrackerSubprovider();
        provider.addProvider(nonceTrackerSubprovider);
        provider.addProvider(createFixtureSubprovider());
        provider.addProvider(
            new FixtureSubprovider({
                eth_sendRawTransaction: (data: any, next: any, end: any) => {
                    end(null);
                },
            }),
        );
        provider.start();

        const noncePayload = {
            ...getTransactionCountPayload,
            params: ['0x1f36f546477cda21bf2296c50976f2740247906f', 'pending'],
        };
        const transaction = new EthereumTx(txParams);
        const txPayload = {
            ...sendTransactionPayload,
            params: [transaction.serialize()],
        };

        const response = await promisify<any>(provider.sendAsync, provider)(noncePayload);
        expect(response.result).to.be.eq('0x00');
        const secondResponse = await promisify<any>(provider.sendAsync, provider)(noncePayload);
        expect(secondResponse.result).to.be.eq('0x00');
        await promisify(provider.sendAsync, provider)(txPayload);
        const thirdResponse = await promisify<any>(provider.sendAsync, provider)(noncePayload);
        expect(thirdResponse.result).to.be.eq('0x01');
    });
});
