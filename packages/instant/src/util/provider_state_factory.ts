import { providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { SupportedProvider, ZeroExProvider } from 'ethereum-types';
import * as Fortmatic from 'fortmatic';

import { FORTMATIC_API_KEY, LOADING_ACCOUNT, NO_ACCOUNT } from '../constants';
import { Maybe, Network, OrderSource, ProviderState, ProviderType } from '../types';
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
            orderSource,
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
                orderSource,
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
            orderSource,
        };
        return providerState;
    },
    getProviderStateBasedOnProviderType: (
        currentProviderState: ProviderState,
        providerType: ProviderType,
    ): ProviderState => {
        let providerState = currentProviderState;
        const chainId = currentProviderState.swapQuoter.chainId;
        const orderSource = currentProviderState.orderSource;
        // Returns current provider if the provider type selected is not found
        if (providerType === ProviderType.MetaMask) {
            const provider = providerFactory.getInjectedProviderIfExists();
            if (provider) {
                providerState = {
                    displayName: envUtil.getProviderDisplayName(provider),
                    name: envUtil.getProviderName(provider),
                    provider,
                    web3Wrapper: new Web3Wrapper(provider),
                    swapQuoter: assetSwapperFactory.getSwapQuoter(provider, orderSource, chainId),
                    swapQuoteConsumer: assetSwapperFactory.getSwapQuoteConsumer(provider, chainId),
                    account: LOADING_ACCOUNT,
                    orderSource,
                };
            }
        }
        if (providerType === ProviderType.Fortmatic) {
            const fm = new Fortmatic(FORTMATIC_API_KEY);
            const fmProvider = fm.getProvider();
            providerState = {
                displayName: envUtil.getProviderDisplayName(fmProvider),
                name: envUtil.getProviderName(fmProvider),
                provider: fmProvider,
                web3Wrapper: new Web3Wrapper(fmProvider),
                swapQuoter: assetSwapperFactory.getSwapQuoter(fmProvider, orderSource, chainId),
                swapQuoteConsumer: assetSwapperFactory.getSwapQuoteConsumer(fmProvider, chainId),
                account: LOADING_ACCOUNT,
                orderSource,
            };
        }
        return providerState;
    },
};
