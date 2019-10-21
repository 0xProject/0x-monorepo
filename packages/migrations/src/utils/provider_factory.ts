import { LedgerEthereumClient, LedgerSubprovider, RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { providerUtils } from '@0x/utils';
import Eth from '@ledgerhq/hw-app-eth';
// tslint:disable:no-implicit-dependencies
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import { Provider } from 'ethereum-types';

async function ledgerEthereumNodeJsClientFactoryAsync(): Promise<LedgerEthereumClient> {
    const ledgerConnection = await TransportNodeHid.create();
    const ledgerEthClient = new Eth(ledgerConnection);
    return ledgerEthClient;
}
export const providerFactory = {
    async getLedgerProviderAsync(networkId: number, rpcUrl: string): Promise<Provider> {
        const provider = new Web3ProviderEngine();
        const ledgerWalletConfigs = {
            networkId,
            ledgerEthereumClientFactoryAsync: ledgerEthereumNodeJsClientFactoryAsync,
        };
        const ledgerSubprovider = new LedgerSubprovider(ledgerWalletConfigs);
        provider.addProvider(ledgerSubprovider);
        provider.addProvider(new RPCSubprovider(rpcUrl));
        providerUtils.startProviderEngine(provider);
        return provider;
    },
};
