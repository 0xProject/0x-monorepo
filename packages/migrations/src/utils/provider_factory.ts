import { LedgerEthereumClient, LedgerSubprovider, RPCSubprovider } from '@0xproject/subproviders';
import Eth from '@ledgerhq/hw-app-eth';
// tslint:disable:no-implicit-dependencies
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import { Provider } from 'ethereum-types';
import ProviderEngine = require('web3-provider-engine');

import { constants } from './constants';

async function ledgerEthereumNodeJsClientFactoryAsync(): Promise<LedgerEthereumClient> {
    const ledgerConnection = await TransportNodeHid.create();
    const ledgerEthClient = new Eth(ledgerConnection);
    return ledgerEthClient;
}
export const providerFactory = {
    async getLedgerProviderAsync(): Promise<Provider> {
        const provider = new ProviderEngine();
        const ledgerWalletConfigs = {
            networkId: constants.KOVAN_NETWORK_ID,
            ledgerEthereumClientFactoryAsync: ledgerEthereumNodeJsClientFactoryAsync,
        };
        const ledgerSubprovider = new LedgerSubprovider(ledgerWalletConfigs);
        provider.addProvider(ledgerSubprovider);
        provider.addProvider(new RPCSubprovider(constants.RPC_URL));
        provider.start();
        return provider;
    },
};
