import { EmptyWalletSubprovider, RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { providerUtils } from '@0x/utils';
import { ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { ETHEREUM_NODE_URL_BY_NETWORK } from '../constants';
import { Maybe, Network } from '../types';

export const providerFactory = {
    getInjectedProviderIfExists: (): Maybe<ZeroExProvider> => {
        const injectedProviderIfExists = (window as any).ethereum;
        if (!_.isUndefined(injectedProviderIfExists)) {
            const provider = providerUtils.standardizeOrThrow(injectedProviderIfExists);
            return provider;
        }
        const injectedWeb3IfExists = (window as any).web3;
        if (!_.isUndefined(injectedWeb3IfExists) && !_.isUndefined(injectedWeb3IfExists.currentProvider)) {
            const currentProvider = injectedWeb3IfExists.currentProvider;
            const provider = providerUtils.standardizeOrThrow(currentProvider);
            return provider;
        }
        return undefined;
    },
    getFallbackNoSigningProvider: (network: Network): Web3ProviderEngine => {
        const providerEngine = new Web3ProviderEngine();
        // Intercept calls to `eth_accounts` and always return empty
        providerEngine.addProvider(new EmptyWalletSubprovider());
        // Construct an RPC subprovider, all data based requests will be sent via the RPCSubprovider
        // TODO(bmillman): make this more resilient to infura failures
        const rpcUrl = ETHEREUM_NODE_URL_BY_NETWORK[network];
        providerEngine.addProvider(new RPCSubprovider(rpcUrl));
        // Start the Provider Engine
        providerUtils.startProviderEngine(providerEngine);
        return providerEngine;
    },
};
