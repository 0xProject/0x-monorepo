import { Web3Wrapper } from '@0x/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { LOADING_ACCOUNT, NO_ACCOUNT } from '../constants';
import { Maybe, Network, OrderSource, ProviderState } from '../types';

import { assetBuyerFactory } from './asset_buyer_factory';
import { providerFactory } from './provider_factory';

export const providerStateFactory = {
    getInitialProviderState: (orderSource: OrderSource, network: Network, provider?: Provider): ProviderState => {
        if (!_.isUndefined(provider)) {
            return providerStateFactory.getInitialProviderStateFromProvider(orderSource, network, provider);
        }
        const providerStateFromWindowIfExits = providerStateFactory.getInitialProviderStateFromWindowIfExists(
            orderSource,
            network,
        );
        if (providerStateFromWindowIfExits) {
            return providerStateFromWindowIfExits;
        } else {
            return providerStateFactory.getInitialProviderStateFallback(orderSource, network);
        }
    },
    getInitialProviderStateFromProvider: (
        orderSource: OrderSource,
        network: Network,
        provider: Provider,
    ): ProviderState => {
        const providerState: ProviderState = {
            provider,
            web3Wrapper: new Web3Wrapper(provider),
            assetBuyer: assetBuyerFactory.getAssetBuyer(provider, orderSource, network),
            account: LOADING_ACCOUNT,
        };
        return providerState;
    },
    getInitialProviderStateFromWindowIfExists: (orderSource: OrderSource, network: Network): Maybe<ProviderState> => {
        const injectedProviderIfExists = providerFactory.getInjectedProviderIfExists();
        if (!_.isUndefined(injectedProviderIfExists)) {
            const providerState: ProviderState = {
                provider: injectedProviderIfExists,
                web3Wrapper: new Web3Wrapper(injectedProviderIfExists),
                assetBuyer: assetBuyerFactory.getAssetBuyer(injectedProviderIfExists, orderSource, network),
                account: LOADING_ACCOUNT,
            };
            return providerState;
        } else {
            return undefined;
        }
    },
    getInitialProviderStateFallback: (orderSource: OrderSource, network: Network): ProviderState => {
        const provider = providerFactory.getFallbackNoSigningProvider(network);
        const providerState: ProviderState = {
            provider,
            web3Wrapper: new Web3Wrapper(provider),
            assetBuyer: assetBuyerFactory.getAssetBuyer(provider, orderSource, network),
            account: NO_ACCOUNT,
        };
        return providerState;
    },
};
