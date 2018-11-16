import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { DEFAULT_ZERO_EX_CONTAINER_SELECTOR, INJECTED_DIV_CLASS, INJECTED_DIV_ID } from './constants';
import { ZeroExInstantOverlay, ZeroExInstantOverlayProps } from './index';
import { assert } from './util/assert';
import { util } from './util/util';

export interface ZeroExInstantConfig extends ZeroExInstantOverlayProps {
    shouldUseHistoryApi?: boolean;
}

export const render = (config: ZeroExInstantConfig, selector: string = DEFAULT_ZERO_EX_CONTAINER_SELECTOR) => {
    assert.isValidOrderSource('orderSource', config.orderSource);
    if (!_.isUndefined(config.defaultSelectedAssetData)) {
        assert.isHexString('defaultSelectedAssetData', config.defaultSelectedAssetData);
    }
    if (!_.isUndefined(config.additionalAssetMetaDataMap)) {
        assert.isValidAssetMetaDataMap('props.additionalAssetMetaDataMap', config.additionalAssetMetaDataMap);
    }
    if (!_.isUndefined(config.defaultAssetBuyAmount)) {
        assert.isNumber('props.defaultAssetBuyAmount', config.defaultAssetBuyAmount);
    }
    if (!_.isUndefined(config.networkId)) {
        assert.isNumber('props.networkId', config.networkId);
    }
    if (!_.isUndefined(config.availableAssetDatas)) {
        assert.areValidAssetDatas('availableAssetDatas', config.availableAssetDatas);
    }
    if (!_.isUndefined(config.onClose)) {
        assert.isFunction('props.onClose', config.onClose);
    }
    if (!_.isUndefined(config.zIndex)) {
        assert.isNumber('props.zIndex', config.zIndex);
    }
    if (!_.isUndefined(config.affiliateInfo)) {
        assert.isValidAffiliateInfo('props.affiliateInfo', config.affiliateInfo);
    }
    if (!_.isUndefined(config.provider)) {
        assert.isWeb3Provider('props.provider', config.provider);
    }
    assert.isString('selector', selector);
    // Render instant and return a callback that allows you to close it.
    const renderInstant = () => {
        const appendToIfExists = document.querySelector(selector);
        assert.assert(!_.isNull(appendToIfExists), `Could not find div with selector: ${selector}`);
        const appendTo = appendToIfExists as Element;
        const injectedDiv = document.createElement('div');
        injectedDiv.setAttribute('id', INJECTED_DIV_ID);
        injectedDiv.setAttribute('class', INJECTED_DIV_CLASS);
        appendTo.appendChild(injectedDiv);
        const instantOverlayProps = {
            ...config,
            onClose: () => window.history.back(),
        };
        ReactDOM.render(React.createElement(ZeroExInstantOverlay, instantOverlayProps), injectedDiv);
        const close = () => appendTo.removeChild(injectedDiv);
        return close;
    };
    // Before we render, push to history saying that instant is showing for this part of the history.
    window.history.pushState({ zeroExInstantShowing: true }, '0x Instant');
    let closeInstant = renderInstant();

    let prevOnPopState = util.boundNoop;
    if (window.onpopstate) {
        prevOnPopState = window.onpopstate.bind(window);
    }
    window.onpopstate = (e: PopStateEvent) => {
        // Don't override integrators handler.
        prevOnPopState(e);
        // e.state represents the new state
        if (e.state && e.state.zeroExInstantShowing) {
            // The user pressed fowards, so re-render instant.
            closeInstant = renderInstant();
        } else {
            // User pressed back, so close instant.
            closeInstant();
            delete window.onpopstate;
            if (!_.isUndefined(config.onClose)) {
                config.onClose();
            }
        }
    };
};
