import { web3Factory } from '@0xproject/dev-utils';
import * as fs from 'fs';
import 'make-promises-safe';

import { ZeroEx } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';

chaiSetup.configure();

// Those tests are slower cause they're talking to a remote node
const TIMEOUT = 10000;

describe('Artifacts', () => {
    describe('contracts are deployed on kovan', () => {
        const kovanRpcUrl = constants.KOVAN_RPC_URL;
        const provider = web3Factory.create({ rpcUrl: kovanRpcUrl }).currentProvider;
        const config = {
            networkId: constants.KOVAN_NETWORK_ID,
        };
        const zeroEx = new ZeroEx(provider, config);
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
        const provider = web3Factory.create({ rpcUrl: ropstenRpcUrl }).currentProvider;
        const config = {
            networkId: constants.ROPSTEN_NETWORK_ID,
        };
        const zeroEx = new ZeroEx(provider, config);
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
