import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { DEFAULT_ZERO_EX_CONTAINER_SELECTOR } from './constants';
import { ZeroExInstant, ZeroExInstantProps } from './index';
import { assert } from './util/assert';

export const render = (props: ZeroExInstantProps, selector: string = DEFAULT_ZERO_EX_CONTAINER_SELECTOR) => {
    assert.isHexString('assetData', props.assetData);
    assert.isValidLiquiditySource('liquiditySource', props.liquiditySource);
    if (!_.isUndefined(props.additionalAssetMetaDataMap)) {
        assert.isValidAssetMetaDataMap('additionalAssetMetaDataMap', props.additionalAssetMetaDataMap);
    }
    if (!_.isUndefined(props.defaultAssetBuyAmount)) {
        assert.isNumber('defaultAssetBuyAmount', props.defaultAssetBuyAmount);
    }
    if (!_.isUndefined(props.networkId)) {
        assert.isNumber('networkId', props.networkId);
    }
    ReactDOM.render(React.createElement(ZeroExInstant, props), document.querySelector(selector));
};
