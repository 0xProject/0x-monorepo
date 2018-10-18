import { AssetBuyer, BuyQuote } from '@0xproject/asset-buyer';
import { ObjectMap } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { Asset, AssetMetaData, AsyncProcessState } from '../types';
import { assetUtils } from '../util/asset';

import { Action, ActionTypes } from './actions';

export interface State {
    assetBuyer?: AssetBuyer;
    assetMetaDataMap: ObjectMap<AssetMetaData>;
    selectedAsset?: Asset;
    selectedAssetAmount?: BigNumber;
    selectedAssetBuyState: AsyncProcessState;
    ethUsdPrice?: BigNumber;
    latestBuyQuote?: BuyQuote;
}

export const INITIAL_STATE: State = {
    selectedAssetAmount: undefined,
    assetMetaDataMap: {},
    selectedAssetBuyState: AsyncProcessState.NONE,
    ethUsdPrice: undefined,
    latestBuyQuote: undefined,
};

// TODO: Figure out why there is an INITIAL_STATE key in the store...
export const reducer = (state: State = INITIAL_STATE, action: Action): State => {
    switch (action.type) {
        case ActionTypes.UPDATE_ETH_USD_PRICE:
            return {
                ...state,
                ethUsdPrice: action.data,
            };
        case ActionTypes.UPDATE_SELECTED_ASSET_AMOUNT:
            return {
                ...state,
                selectedAssetAmount: action.data,
            };
        case ActionTypes.UPDATE_LATEST_BUY_QUOTE:
            return {
                ...state,
                latestBuyQuote: action.data,
            };
        case ActionTypes.UPDATE_SELECTED_ASSET_BUY_STATE:
            return {
                ...state,
                selectedAssetBuyState: action.data,
            };
        case ActionTypes.UPDATE_SELECTED_ASSET:
            const newSelectedAssetData = action.data;
            let newSelectedAsset: Asset | undefined;
            if (!_.isUndefined(newSelectedAssetData)) {
                newSelectedAsset = assetUtils.createAssetFromAssetData(newSelectedAssetData, state.assetMetaDataMap);
            }
            return {
                ...state,
                selectedAsset: newSelectedAsset,
            };
        default:
            return state;
    }
};
