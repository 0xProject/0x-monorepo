import { providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { SupportedProvider, ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { LOADING_ACCOUNT, NO_ACCOUNT } from '../constants';
import { Maybe, Network, OrderSource, ProviderState } from '../types';
import { envUtil } from '../util/env';

import { assetSwapperFactory } from './asset_swapper_factory';
import { providerFactory } from './provider_factory';

export const providerStateFactory = {
    getInitialProviderState: (
        orderSource: OrderSource,
        network: Network,
        supportedProvider?: SupportedProvider,
        walletDisplayName?: string,
    ): ProviderState => {
        if (supportedProvider !== undefined) {
            const provider = providerUtils.standardizeOrThrow(supportedProvider);
            return providerStateFactory.getInitialProviderStateFromProvider(
                orderSource,
                network,
                provider,
                walletDisplayName,
            );
        }
        const providerStateFromWindowIfExits = providerStateFactory.getInitialProviderStateFromWindowIfExists(
            orderSource,
            network,
            walletDisplayName,
        );
        if (providerStateFromWindowIfExits) {
            return providerStateFromWindowIfExits;
        } else {
            return providerStateFactory.getInitialProviderStateFallback(orderSource, network, walletDisplayName);
        }
    },
    getInitialProviderStateFromProvider: (
        orderSource: OrderSource,
        network: Network,
        provider: ZeroExProvider,
        walletDisplayName?: string,
    ): ProviderState => {
        const providerState: ProviderState = {
            name: envUtil.getProviderName(provider),
            displayName: walletDisplayName || envUtil.getProviderDisplayName(provider),
            provider,
            web3Wrapper: new Web3Wrapper(provider),
            swapQuoter: assetSwapperFactory.getSwapQuoter(provider, orderSource, network),
            swapQuoteConsumer: assetSwapperFactory.getSwapQuoteConsumer(provider, network),
            account: LOADING_ACCOUNT,
        };
        return providerState;
    },
    getInitialProviderStateFromWindowIfExists: (
        orderSource: OrderSource,
        network: Network,
        walletDisplayName?: string,
    ): Maybe<ProviderState> => {
        const injectedProviderIfExists = providerFactory.getInjectedProviderIfExists();
        if (injectedProviderIfExists !== undefined) {
            const providerState: ProviderState = {
                name: envUtil.getProviderName(injectedProviderIfExists),
                displayName: walletDisplayName || envUtil.getProviderDisplayName(injectedProviderIfExists),
                provider: injectedProviderIfExists,
                web3Wrapper: new Web3Wrapper(injectedProviderIfExists),
                swapQuoter: assetSwapperFactory.getSwapQuoter(injectedProviderIfExists, orderSource, network),
                swapQuoteConsumer: assetSwapperFactory.getSwapQuoteConsumer(injectedProviderIfExists, network),
                account: LOADING_ACCOUNT,
            };
            return providerState;
        } else {
            return undefined;
        }
    },
    getInitialProviderStateFallback: (
        orderSource: OrderSource,
        network: Network,
        walletDisplayName?: string,
    ): ProviderState => {
        const provider = providerFactory.getFallbackNoSigningProvider(network);
        const providerState: ProviderState = {
            name: 'Fallback',
            displayName: walletDisplayName || envUtil.getProviderDisplayName(provider),
            provider,
            web3Wrapper: new Web3Wrapper(provider),
            swapQuoter: assetSwapperFactory.getSwapQuoter(provider, orderSource, network),
            swapQuoteConsumer: assetSwapperFactory.getSwapQuoteConsumer(provider, network),
            account: NO_ACCOUNT,
        };
        return providerState;
    },
};
