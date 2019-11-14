import { BigNumber, SwapQuoter } from '@0x/asset-swapper';
import { assetDataUtils } from '@0x/order-utils';
import { AssetProxyId } from '@0x/types';
import { providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {
    DEFAULT_ZERO_EX_CONTAINER_SELECTOR,
    GIT_SHA as GIT_SHA_FROM_CONSTANT,
    INJECTED_DIV_CLASS,
    INJECTED_DIV_ID,
    NPM_PACKAGE_VERSION,
} from './constants';
import { assetMetaDataMap } from './data/asset_meta_data_map';
import { ZeroExInstantOverlay, ZeroExInstantOverlayProps } from './index';
import { Network, OrderSource } from './types';
import { analytics } from './util/analytics';
import { assert } from './util/assert';
import { orderCoercionUtil } from './util/order_coercion';
import { providerFactory } from './util/provider_factory';
import { util } from './util/util';

const isInstantRendered = (): boolean => !!document.getElementById(INJECTED_DIV_ID);

const validateInstantRenderConfig = (config: ZeroExInstantConfig, selector: string) => {
    assert.isValidOrderSource('orderSource', config.orderSource);
    if (config.defaultSelectedAssetData !== undefined) {
        assert.isHexString('defaultSelectedAssetData', config.defaultSelectedAssetData);
    }
    if (config.additionalAssetMetaDataMap !== undefined) {
        assert.isValidAssetMetaDataMap('additionalAssetMetaDataMap', config.additionalAssetMetaDataMap);
    }
    if (config.defaultAssetBuyAmount !== undefined) {
        assert.isNumber('defaultAssetBuyAmount', config.defaultAssetBuyAmount);
    }
    if (config.networkId !== undefined) {
        assert.isNumber('networkId', config.networkId);
    }
    if (config.availableAssetDatas !== undefined) {
        assert.areValidAssetDatas('availableAssetDatas', config.availableAssetDatas);
    }
    if (config.onClose !== undefined) {
        assert.isFunction('onClose', config.onClose);
    }
    if (config.zIndex !== undefined) {
        assert.isNumber('zIndex', config.zIndex);
    }
    if (config.affiliateInfo !== undefined) {
        assert.isValidAffiliateInfo('affiliateInfo', config.affiliateInfo);
    }
    if (config.provider !== undefined) {
        providerUtils.standardizeOrThrow(config.provider);
    }
    if (config.walletDisplayName !== undefined) {
        assert.isString('walletDisplayName', config.walletDisplayName);
    }
    if (config.shouldDisablePushToHistory !== undefined) {
        assert.isBoolean('shouldDisablePushToHistory', config.shouldDisablePushToHistory);
    }
    if (config.shouldDisableAnalyticsTracking !== undefined) {
        assert.isBoolean('shouldDisableAnalyticsTracking', config.shouldDisableAnalyticsTracking);
    }
    assert.isString('selector', selector);
};

let injectedDiv: HTMLDivElement | undefined;
let parentElement: Element | undefined;
export const unrender = () => {
    if (!injectedDiv) {
        return;
    }

    ReactDOM.unmountComponentAtNode(injectedDiv);
    if (parentElement && parentElement.contains(injectedDiv)) {
        parentElement.removeChild(injectedDiv);
    }
};

// Render instant and return a callback that allows you to remove it from the DOM.
const renderInstant = (config: ZeroExInstantConfig, selector: string) => {
    const appendToIfExists = document.querySelector(selector);
    assert.assert(appendToIfExists !== null, `Could not find div with selector: ${selector}`);
    parentElement = appendToIfExists;
    injectedDiv = document.createElement('div');
    injectedDiv.setAttribute('id', INJECTED_DIV_ID);
    injectedDiv.setAttribute('class', INJECTED_DIV_CLASS);
    parentElement.appendChild(injectedDiv);
    const closeInstant = () => {
        analytics.trackInstantClosed();
        if (config.onClose !== undefined) {
            config.onClose();
        }
        unrender();
    };
    const instantOverlayProps = {
        ...config,
        // If we are using the history API, just go back to close
        onClose: () => (config.shouldDisablePushToHistory ? closeInstant() : window.history.back()),
    };
    ReactDOM.render(React.createElement(ZeroExInstantOverlay, instantOverlayProps), injectedDiv);
    return closeInstant;
};

export interface ZeroExInstantConfig extends ZeroExInstantOverlayProps {
    shouldDisablePushToHistory?: boolean;
}

export const render = (config: ZeroExInstantConfig, selector: string = DEFAULT_ZERO_EX_CONTAINER_SELECTOR) => {
    // Coerces BigNumber provided in config to version utilized by 0x packages
    const coercedConfig = _.assign({}, config, {
        orderSource: _.isArray(config.orderSource)
            ? orderCoercionUtil.coerceOrderArrayFieldsToBigNumber(config.orderSource)
            : config.orderSource,
    });

    validateInstantRenderConfig(coercedConfig, selector);

    if (coercedConfig.shouldDisablePushToHistory) {
        if (!isInstantRendered()) {
            renderInstant(coercedConfig, selector);
        }
        return;
    }
    // Before we render, push to history saying that instant is showing for this part of the history.
    window.history.pushState({ zeroExInstantShowing: true }, '0x Instant');
    let removeInstant = renderInstant(coercedConfig, selector);
    // If the integrator defined a popstate handler, save it to __zeroExInstantIntegratorsPopStateHandler
    // unless we have already done so on a previous render.
    const anyWindow = window as any;
    const popStateExistsAndNotSetPreviously = window.onpopstate && !anyWindow.__zeroExInstantIntegratorsPopStateHandler;
    anyWindow.__zeroExInstantIntegratorsPopStateHandler = popStateExistsAndNotSetPreviously
        ? anyWindow.onpopstate.bind(window)
        : util.boundNoop;
    const onPopStateHandler = (e: PopStateEvent) => {
        anyWindow.__zeroExInstantIntegratorsPopStateHandler(e);
        const newState = e.state;
        if (newState && newState.zeroExInstantShowing) {
            // We have returned to a history state that expects instant to be rendered.
            if (!isInstantRendered()) {
                removeInstant = renderInstant(coercedConfig, selector);
            }
        } else {
            // History has changed to a different state.
            if (isInstantRendered()) {
                removeInstant();
            }
        }
    };
    window.onpopstate = onPopStateHandler;
};

export const ERC721_PROXY_ID = AssetProxyId.ERC721;

export const ERC20_PROXY_ID = AssetProxyId.ERC20;

export const assetDataForERC20TokenAddress = (tokenAddress: string): string => {
    assert.isETHAddressHex('tokenAddress', tokenAddress);
    return assetDataUtils.encodeERC20AssetData(tokenAddress);
};

export const assetDataForERC721TokenAddress = (tokenAddress: string, tokenId: string | number): string => {
    assert.isETHAddressHex('tokenAddress', tokenAddress);
    return assetDataUtils.encodeERC721AssetData(tokenAddress, new BigNumber(tokenId));
};

export const hasMetaDataForAssetData = (assetData: string): boolean => {
    assert.isHexString('assetData', assetData);
    return assetMetaDataMap[assetData] !== undefined;
};

export const hasLiquidityForAssetDataAsync = async (
    takerAssetData: string,
    orderSource: OrderSource,
    chainId: Network = Network.Mainnet,
    supportedProvider?: SupportedProvider,
): Promise<boolean> => {
    assert.isHexString('takerAssetData', takerAssetData);
    assert.isValidOrderSource('orderSource', orderSource);
    assert.isNumber('chainId', chainId);

    let provider = supportedProvider;
    if (provider !== undefined) {
        provider = providerUtils.standardizeOrThrow(provider);
    }

    const bestProvider: ZeroExProvider = provider || providerFactory.getFallbackNoSigningProvider(chainId);

    const swapQuoterOptions = { chainId };

    const swapQuoter = _.isString(orderSource)
        ? SwapQuoter.getSwapQuoterForStandardRelayerAPIUrl(bestProvider, orderSource, swapQuoterOptions)
        : SwapQuoter.getSwapQuoterForProvidedOrders(bestProvider, orderSource, swapQuoterOptions);

    const wethAssetData = await swapQuoter.getEtherTokenAssetDataOrThrowAsync();
    const liquidity = await swapQuoter.getLiquidityForMakerTakerAssetDataPairAsync(wethAssetData, takerAssetData);
    return liquidity.makerAssetAvailableInBaseUnits.gt(new BigNumber(0));
};

// Write version info to the exported object for debugging
export const GIT_SHA = GIT_SHA_FROM_CONSTANT;
export const NPM_VERSION = NPM_PACKAGE_VERSION;
