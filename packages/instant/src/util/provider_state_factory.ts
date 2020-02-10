import { providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { SupportedProvider, ZeroExProvider } from 'ethereum-types';
import * as Fortmatic from 'fortmatic';

import { FORTMATIC_API_KEY, LOCKED_ACCOUNT, NO_ACCOUNT } from '../constants';
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
            account: LOCKED_ACCOUNT,
            orderSource,
            isProviderInjected: false,
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
                account: LOCKED_ACCOUNT,
                orderSource,
                isProviderInjected: true,
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
            isProviderInjected: true,
        };
        return providerState;
    },
    // function to call getInitialProviderState with parameters retreived from a provided ProviderState
    getInitialProviderStateWithCurrentProviderState: (currentProviderState: ProviderState): ProviderState => {
        const orderSource = currentProviderState.orderSource;
        const chainId = currentProviderState.swapQuoter.chainId;
        // If provider is provided to instant, use that and the displayName
        if (!currentProviderState.isProviderInjected) {
            return providerStateFactory.getInitialProviderState(
                orderSource,
                chainId,
                currentProviderState.provider,
                currentProviderState.displayName,
            );
        }
        const newProviderState = providerStateFactory.getInitialProviderState(orderSource, chainId);
        newProviderState.account = LOCKED_ACCOUNT;
        return newProviderState;
    },
    getProviderStateBasedOnProviderType: (
        currentProviderState: ProviderState,
        providerType: ProviderType,
    ): ProviderState => {
        const chainId = currentProviderState.swapQuoter.chainId;
        const orderSource = currentProviderState.orderSource;
        // Returns current provider if the provider type selected is not found
        if (providerType === ProviderType.MetaMask) {
            const provider = providerFactory.getInjectedProviderIfExists();
            if (provider) {
                return {
                    displayName: envUtil.getProviderDisplayName(provider),
                    name: envUtil.getProviderName(provider),
                    provider,
                    web3Wrapper: new Web3Wrapper(provider),
                    swapQuoter: assetSwapperFactory.getSwapQuoter(provider, orderSource, chainId),
                    swapQuoteConsumer: assetSwapperFactory.getSwapQuoteConsumer(provider, chainId),
                    account: LOCKED_ACCOUNT,
                    orderSource,
                    isProviderInjected: true,
                };
            }
        }
        if (providerType === ProviderType.Fortmatic) {
            const fm = new Fortmatic(FORTMATIC_API_KEY);
            const fmProvider = fm.getProvider();
            return {
                displayName: envUtil.getProviderDisplayName(fmProvider),
                name: envUtil.getProviderName(fmProvider),
                provider: fmProvider,
                web3Wrapper: new Web3Wrapper(fmProvider),
                swapQuoter: assetSwapperFactory.getSwapQuoter(fmProvider, orderSource, chainId),
                swapQuoteConsumer: assetSwapperFactory.getSwapQuoteConsumer(fmProvider, chainId),
                account: LOCKED_ACCOUNT,
                orderSource,
                isProviderInjected: true,
            };
        }
        return providerStateFactory.getInitialProviderState(orderSource, chainId);
    },
};
