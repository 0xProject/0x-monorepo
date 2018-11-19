import { EmptyWalletSubprovider, RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { BLOCK_POLLING_INTERVAL_MS, ETHEREUM_NODE_URL_BY_NETWORK } from '../constants';
import { Maybe, Network } from '../types';

export const providerFactory = {
    getInjectedProviderIfExists: (): Maybe<Provider> => {
        const injectedProviderIfExists = (window as any).ethereum;
        if (!_.isUndefined(injectedProviderIfExists)) {
            return injectedProviderIfExists;
        }
        const injectedWeb3IfExists = (window as any).web3;
        if (!_.isUndefined(injectedWeb3IfExists) && !_.isUndefined(injectedWeb3IfExists.currentProvider)) {
            return injectedWeb3IfExists.currentProvider;
        }
        return undefined;
    },
    getFallbackNoSigningProvider: (network: Network): Provider => {
        const providerEngine = new Web3ProviderEngine({
            pollingInterval: BLOCK_POLLING_INTERVAL_MS,
        });
        // Intercept calls to `eth_accounts` and always return empty
        providerEngine.addProvider(new EmptyWalletSubprovider());
        // Construct an RPC subprovider, all data based requests will be sent via the RPCSubprovider
        // TODO(bmillman): make this more resilient to infura failures
        const rpcUrl = ETHEREUM_NODE_URL_BY_NETWORK[network];
        providerEngine.addProvider(new RPCSubprovider(rpcUrl));
        // // Start the Provider Engine
        providerEngine.start();
        return providerEngine;
    },
};
