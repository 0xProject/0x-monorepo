import * as fs from 'fs';
import HDWalletProvider = require('truffle-hdwallet-provider');

import { ZeroEx } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';

chaiSetup.configure();

// Those tests are slower cause they're talking to a remote node
const TIMEOUT = 10000;

describe('Artifacts', () => {
    describe('contracts are deployed on kovan', () => {
        const kovanRpcUrl = constants.KOVAN_RPC_URL;
        const packageJSONContent = fs.readFileSync('package.json', 'utf-8');
        const packageJSON = JSON.parse(packageJSONContent);
        const mnemonic = packageJSON.config.mnemonic;
        const web3Provider = new HDWalletProvider(mnemonic, kovanRpcUrl);
        const config = {
            networkId: constants.KOVAN_NETWORK_ID,
        };
        const zeroEx = new ZeroEx(web3Provider, config);
        it('token registry contract is deployed', async () => {
            await (zeroEx.tokenRegistry as any)._getTokenRegistryContractAsync();
        }).timeout(TIMEOUT);
        it('proxy contract is deployed', async () => {
            await (zeroEx.proxy as any)._getTokenTransferProxyContractAsync();
        }).timeout(TIMEOUT);
        it('exchange contract is deployed', async () => {
            await (zeroEx.exchange as any)._getExchangeContractAsync();
        }).timeout(TIMEOUT);
    });
    describe('contracts are deployed on ropsten', () => {
        const ropstenRpcUrl = constants.ROPSTEN_RPC_URL;
        const packageJSONContent = fs.readFileSync('package.json', 'utf-8');
        const packageJSON = JSON.parse(packageJSONContent);
        const mnemonic = packageJSON.config.mnemonic;
        const web3Provider = new HDWalletProvider(mnemonic, ropstenRpcUrl);
        const config = {
            networkId: constants.ROPSTEN_NETWORK_ID,
        };
        const zeroEx = new ZeroEx(web3Provider, config);
        it('token registry contract is deployed', async () => {
            await (zeroEx.tokenRegistry as any)._getTokenRegistryContractAsync();
        }).timeout(TIMEOUT);
        it('proxy contract is deployed', async () => {
            await (zeroEx.proxy as any)._getTokenTransferProxyContractAsync();
        }).timeout(TIMEOUT);
        it('exchange contract is deployed', async () => {
            await (zeroEx.exchange as any)._getExchangeContractAsync();
        }).timeout(TIMEOUT);
    });
});
