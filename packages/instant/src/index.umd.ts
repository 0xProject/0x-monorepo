import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { DEFAULT_ZERO_EX_CONTAINER_SELECTOR, INJECTED_DIV_ID } from './constants';
import { ZeroExInstantOverlay, ZeroExInstantOverlayProps } from './index';
import { assert } from './util/assert';

export const render = (props: ZeroExInstantOverlayProps, selector: string = DEFAULT_ZERO_EX_CONTAINER_SELECTOR) => {
    assert.isHexString('props.assetData', props.assetData);
    assert.isValidLiquiditySource('props.liquiditySource', props.liquiditySource);
    if (!_.isUndefined(props.additionalAssetMetaDataMap)) {
        assert.isValidAssetMetaDataMap('props.additionalAssetMetaDataMap', props.additionalAssetMetaDataMap);
    }
    if (!_.isUndefined(props.defaultAssetBuyAmount)) {
        assert.isNumber('props.defaultAssetBuyAmount', props.defaultAssetBuyAmount);
    }
    if (!_.isUndefined(props.networkId)) {
        assert.isNumber('props.networkId', props.networkId);
    }
    if (!_.isUndefined(props.onClose)) {
        assert.isFunction('props.onClose', props.onClose);
    }
    if (!_.isUndefined(props.zIndex)) {
        assert.isNumber('props.zIndex', props.zIndex);
    }
    if (!_.isUndefined(props.affiliateInfo)) {
        assert.isValidaffiliateInfo('props.affiliateInfo', props.affiliateInfo);
    }
    const appendToIfExists = document.querySelector(selector);
    assert.assert(!_.isNull(appendToIfExists), `Could not find div with selector: ${selector}`);
    const appendTo = appendToIfExists as Element;
    const injectedDiv = document.createElement('div');
    injectedDiv.setAttribute('id', INJECTED_DIV_ID);
    appendTo.appendChild(injectedDiv);
    const instantOverlayProps = {
        ...props,
        onClose: () => {
            appendTo.removeChild(injectedDiv);
            if (!_.isUndefined(props.onClose)) {
                props.onClose();
            }
        },
    };
    ReactDOM.render(React.createElement(ZeroExInstantOverlay, instantOverlayProps), injectedDiv);
};
