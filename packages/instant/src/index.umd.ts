import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { DEFAULT_ZERO_EX_CONTAINER_SELECTOR, INJECTED_DIV_CLASS, INJECTED_DIV_ID } from './constants';
import { ZeroExInstantOverlay, ZeroExInstantOverlayProps } from './index';
import { assert } from './util/assert';
import { util } from './util/util';

export const render = (props: ZeroExInstantOverlayProps, selector: string = DEFAULT_ZERO_EX_CONTAINER_SELECTOR) => {
    assert.isValidOrderSource('orderSource', props.orderSource);
    if (!_.isUndefined(props.defaultSelectedAssetData)) {
        assert.isHexString('defaultSelectedAssetData', props.defaultSelectedAssetData);
    }
    if (!_.isUndefined(props.additionalAssetMetaDataMap)) {
        assert.isValidAssetMetaDataMap('props.additionalAssetMetaDataMap', props.additionalAssetMetaDataMap);
    }
    if (!_.isUndefined(props.defaultAssetBuyAmount)) {
        assert.isNumber('props.defaultAssetBuyAmount', props.defaultAssetBuyAmount);
    }
    if (!_.isUndefined(props.networkId)) {
        assert.isNumber('props.networkId', props.networkId);
    }
    if (!_.isUndefined(props.availableAssetDatas)) {
        assert.areValidAssetDatas('availableAssetDatas', props.availableAssetDatas);
    }
    if (!_.isUndefined(props.onClose)) {
        assert.isFunction('props.onClose', props.onClose);
    }
    if (!_.isUndefined(props.zIndex)) {
        assert.isNumber('props.zIndex', props.zIndex);
    }
    if (!_.isUndefined(props.affiliateInfo)) {
        assert.isValidAffiliateInfo('props.affiliateInfo', props.affiliateInfo);
    }
    if (!_.isUndefined(props.provider)) {
        assert.isWeb3Provider('props.provider', props.provider);
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
            ...props,
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
            if (!_.isUndefined(props.onClose)) {
                props.onClose();
            }
        }
    };
};
