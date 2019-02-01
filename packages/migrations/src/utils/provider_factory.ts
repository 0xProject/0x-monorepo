import { LedgerEthereumClient, LedgerSubprovider, RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import Eth from '@ledgerhq/hw-app-eth';
// tslint:disable:no-implicit-dependencies
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import { Provider } from 'ethereum-types';

import { constants } from './constants';

async function ledgerEthereumNodeJsClientFactoryAsync(): Promise<LedgerEthereumClient> {
    const ledgerConnection = await TransportNodeHid.create();
    const ledgerEthClient = new Eth(ledgerConnection);
    return ledgerEthClient;
}
export const providerFactory = {
    async getKovanLedgerProviderAsync(): Promise<Provider> {
        const provider = new Web3ProviderEngine();
        const ledgerWalletConfigs = {
            networkId: constants.KOVAN_NETWORK_ID,
            ledgerEthereumClientFactoryAsync: ledgerEthereumNodeJsClientFactoryAsync,
        };
        const ledgerSubprovider = new LedgerSubprovider(ledgerWalletConfigs);
        provider.addProvider(ledgerSubprovider);
        provider.addProvider(new RPCSubprovider(constants.KOVAN_RPC_URL));
        provider.start();
        return provider;
    },
    async getMainnetLedgerProviderAsync(): Promise<Provider> {
        const provider = new Web3ProviderEngine();
        const ledgerWalletConfigs = {
            networkId: constants.MAINNET_NETWORK_ID,
            ledgerEthereumClientFactoryAsync: ledgerEthereumNodeJsClientFactoryAsync,
        };
        const ledgerSubprovider = new LedgerSubprovider(ledgerWalletConfigs);
        provider.addProvider(ledgerSubprovider);
        provider.addProvider(new RPCSubprovider(constants.MAINNET_RPC_URL));
        provider.start();
        return provider;
    },
};
