import * as fs from 'fs';
import * as chai from 'chai';
import {chaiSetup} from './utils/chai_setup';
import HDWalletProvider = require('truffle-hdwallet-provider');
import {ZeroEx} from '../src';
import {constants} from './utils/constants';

chaiSetup.configure();
const expect = chai.expect;

// Those tests are slower cause they're talking to a remote node
const TIMEOUT = 10000;

describe('Artifacts', () => {
    describe('contracts are deployed on kovan', () => {
        const kovanRpcUrl = constants.KOVAN_RPC_URL;
        const packageJSONContent = fs.readFileSync('package.json', 'utf-8');
        const packageJSON = JSON.parse(packageJSONContent);
        const mnemonic = packageJSON.config.mnemonic;
        const web3Provider = new HDWalletProvider(mnemonic, kovanRpcUrl);
        const zeroEx = new ZeroEx(web3Provider);
        it('token registry contract is deployed', async () => {
            await (zeroEx.tokenRegistry as any)._getTokenRegistryContractAsync();
        }).timeout(TIMEOUT);
        it('proxy contract is deployed', async () => {
            await (zeroEx.token as any)._getTokenTransferProxyAddressAsync();
        }).timeout(TIMEOUT);
        it('exchange contract is deployed', async () => {
            await zeroEx.exchange.getContractAddressAsync();
        }).timeout(TIMEOUT);
    });
    describe('contracts are deployed on ropsten', () => {
        const ropstenRpcUrl = constants.ROPSTEN_RPC_URL;
        const packageJSONContent = fs.readFileSync('package.json', 'utf-8');
        const packageJSON = JSON.parse(packageJSONContent);
        const mnemonic = packageJSON.config.mnemonic;
        const web3Provider = new HDWalletProvider(mnemonic, ropstenRpcUrl);
        const zeroEx = new ZeroEx(web3Provider);
        it('token registry contract is deployed', async () => {
            await (zeroEx.tokenRegistry as any)._getTokenRegistryContractAsync();
        }).timeout(TIMEOUT);
        it('proxy contract is deployed', async () => {
            await (zeroEx.token as any)._getTokenTransferProxyAddressAsync();
        }).timeout(TIMEOUT);
        it('exchange contract is deployed', async () => {
            await zeroEx.exchange.getContractAddressAsync();
        }).timeout(TIMEOUT);
    });
});
