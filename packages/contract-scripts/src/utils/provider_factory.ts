// HACK: web3 injects XMLHttpRequest into the global scope and ProviderEngine checks XMLHttpRequest
// to know whether it is running in a browser or node environment. We need it to be undefined since
// we are not running in a browser env.
// Filed issue: https://github.com/ethereum/web3.js/issues/844
(global as any).XMLHttpRequest = undefined;
import { LedgerEthereumClient, LedgerSubprovider, NonceTrackerSubprovider } from '@0xproject/subproviders';
import Eth from '@ledgerhq/hw-app-eth';
// tslint:disable:no-implicit-dependencies
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import { Provider } from 'ethereum-types';
import ProviderEngine = require('web3-provider-engine');
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

async function ledgerEthereumNodeJsClientFactoryAsync(): Promise<LedgerEthereumClient> {
    const ledgerConnection = await TransportNodeHid.create();
    const ledgerEthClient = new Eth(ledgerConnection);
    return ledgerEthClient;
}
export const providerFactory = {
    getLedgerProvider(): Provider {
        const provider = new ProviderEngine();
        const ledgerWalletConfigs = {
            networkId: 1,
            ledgerEthereumClientFactoryAsync: ledgerEthereumNodeJsClientFactoryAsync,
        };
        const ledgerSubprovider = new LedgerSubprovider(ledgerWalletConfigs);
        provider.addProvider(new NonceTrackerSubprovider());
        provider.addProvider(ledgerSubprovider);
        provider.addProvider(
            new RpcSubprovider({
                rpcUrl: 'https://mainnet.infura.io/',
            }),
        );
        provider.start();
        return provider;
    },
};
