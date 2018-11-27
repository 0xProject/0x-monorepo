import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { DEFAULT_ZERO_EX_CONTAINER_SELECTOR, INJECTED_DIV_CLASS, INJECTED_DIV_ID } from './constants';
import { ZeroExInstantOverlay, ZeroExInstantOverlayProps } from './index';
import { assert } from './util/assert';
import { util } from './util/util';

const isInstantRendered = (): boolean => !!document.getElementById(INJECTED_DIV_ID);

const validateInstantRenderConfig = (config: ZeroExInstantConfig, selector: string) => {
    assert.isValidOrderSource('orderSource', config.orderSource);
    if (!_.isUndefined(config.defaultSelectedAssetData)) {
        assert.isHexString('defaultSelectedAssetData', config.defaultSelectedAssetData);
    }
    if (!_.isUndefined(config.additionalAssetMetaDataMap)) {
        assert.isValidAssetMetaDataMap('additionalAssetMetaDataMap', config.additionalAssetMetaDataMap);
    }
    if (!_.isUndefined(config.defaultAssetBuyAmount)) {
        assert.isNumber('defaultAssetBuyAmount', config.defaultAssetBuyAmount);
    }
    if (!_.isUndefined(config.networkId)) {
        assert.isNumber('networkId', config.networkId);
    }
    if (!_.isUndefined(config.availableAssetDatas)) {
        assert.areValidAssetDatas('availableAssetDatas', config.availableAssetDatas);
    }
    if (!_.isUndefined(config.onClose)) {
        assert.isFunction('onClose', config.onClose);
    }
    if (!_.isUndefined(config.zIndex)) {
        assert.isNumber('zIndex', config.zIndex);
    }
    if (!_.isUndefined(config.affiliateInfo)) {
        assert.isValidAffiliateInfo('affiliateInfo', config.affiliateInfo);
    }
    if (!_.isUndefined(config.provider)) {
        assert.isWeb3Provider('provider', config.provider);
    }
    if (!_.isUndefined(config.shouldDisablePushToHistory)) {
        assert.isBoolean('shouldDisablePushToHistory', config.shouldDisablePushToHistory);
    }
    if (!_.isUndefined(config.shouldDisableAnalyticsTracking)) {
        assert.isBoolean('shouldDisableAnalyticsTracking', config.shouldDisableAnalyticsTracking);
    }
    assert.isString('selector', selector);
};

// Render instant and return a callback that allows you to remove it from the DOM.
const renderInstant = (config: ZeroExInstantConfig, selector: string) => {
    const appendToIfExists = document.querySelector(selector);
    assert.assert(!_.isNull(appendToIfExists), `Could not find div with selector: ${selector}`);
    const appendTo = appendToIfExists as Element;
    const injectedDiv = document.createElement('div');
    injectedDiv.setAttribute('id', INJECTED_DIV_ID);
    injectedDiv.setAttribute('class', INJECTED_DIV_CLASS);
    appendTo.appendChild(injectedDiv);
    const closeInstant = () => {
        if (!_.isUndefined(config.onClose)) {
            config.onClose();
        }
        appendTo.removeChild(injectedDiv);
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
    validateInstantRenderConfig(config, selector);
    if (config.shouldDisablePushToHistory) {
        if (!isInstantRendered()) {
            renderInstant(config, selector);
        }
        return;
    }
    // Before we render, push to history saying that instant is showing for this part of the history.
    window.history.pushState({ zeroExInstantShowing: true }, '0x Instant');
    let removeInstant = renderInstant(config, selector);
    // If the integrator defined a popstate handler, save it to __zeroExInstantIntegratorsPopStateHandler
    // unless we have already done so on a previous render.
    const anyWindow = window as any;
    if (window.onpopstate && !anyWindow.__zeroExInstantIntegratorsPopStateHandler) {
        anyWindow.__zeroExInstantIntegratorsPopStateHandler = window.onpopstate.bind(window);
    }
    const integratorsOnPopStateHandler = anyWindow.__zeroExInstantIntegratorsPopStateHandler || util.boundNoop;
    const onPopStateHandler = (e: PopStateEvent) => {
        integratorsOnPopStateHandler(e);
        const newState = e.state;
        if (newState && newState.zeroExInstantShowing) {
            // We have returned to a history state that expects instant to be rendered.
            if (!isInstantRendered()) {
                removeInstant = renderInstant(config, selector);
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
