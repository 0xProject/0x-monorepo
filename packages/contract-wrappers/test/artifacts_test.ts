import { web3Factory } from '@0xproject/dev-utils';

import { ContractWrappers } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';

chaiSetup.configure();

// Those tests are slower cause they're talking to a remote node
const TIMEOUT = 10000;

describe.skip('Artifacts', () => {
    describe('contracts are deployed on kovan', () => {
        const kovanRpcUrl = constants.KOVAN_RPC_URL;
        const provider = web3Factory.getRpcProvider({ rpcUrl: kovanRpcUrl });
        const config = {
            networkId: constants.KOVAN_NETWORK_ID,
        };
        const contractWrappers = new ContractWrappers(provider, config);
        it('erc20 proxy contract is deployed', async () => {
            await (contractWrappers.erc20Proxy as any)._getTokenTransferProxyContractAsync();
        }).timeout(TIMEOUT);
        it('erc721 proxy contract is deployed', async () => {
            await (contractWrappers.erc721Proxy as any)._getTokenTransferProxyContractAsync();
        }).timeout(TIMEOUT);
    });
    describe('contracts are deployed on ropsten', () => {
        const ropstenRpcUrl = constants.ROPSTEN_RPC_URL;
        const provider = web3Factory.getRpcProvider({ rpcUrl: ropstenRpcUrl });
        const config = {
            networkId: constants.ROPSTEN_NETWORK_ID,
        };
        const contractWrappers = new ContractWrappers(provider, config);
        it('erc20 proxy contract is deployed', async () => {
            await (contractWrappers.erc20Proxy as any)._getTokenTransferProxyContractAsync();
        }).timeout(TIMEOUT);
        it('erc721 proxy contract is deployed', async () => {
            await (contractWrappers.erc721Proxy as any)._getTokenTransferProxyContractAsync();
        }).timeout(TIMEOUT);
    });
});
