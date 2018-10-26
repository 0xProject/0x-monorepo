import { AssetBuyer, BuyQuote } from '@0x/asset-buyer';
import { ObjectMap } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { assetMetaDataMap } from '../data/asset_meta_data_map';
import {
    Asset,
    AssetMetaData,
    AsyncProcessState,
    DisplayStatus,
    Network,
    OrderProcessState,
    OrderState,
} from '../types';
import { assetUtils } from '../util/asset';
import { BigNumberInput } from '../util/big_number_input';

import { Action, ActionTypes } from './actions';

export interface State {
    network: Network;
    assetBuyer?: AssetBuyer;
    assetMetaDataMap: ObjectMap<AssetMetaData>;
    selectedAsset?: Asset;
    selectedAssetAmount?: BigNumberInput;
    buyOrderState: OrderState;
    ethUsdPrice?: BigNumber;
    latestBuyQuote?: BuyQuote;
    quoteRequestState: AsyncProcessState;
    latestErrorMessage?: string;
    latestErrorDisplayStatus: DisplayStatus;
}

export const INITIAL_STATE: State = {
    network: Network.Mainnet,
    selectedAssetAmount: undefined,
    assetMetaDataMap,
    buyOrderState: { processState: OrderProcessState.NONE },
    ethUsdPrice: undefined,
    latestBuyQuote: undefined,
    latestErrorMessage: undefined,
    latestErrorDisplayStatus: DisplayStatus.Hidden,
    quoteRequestState: AsyncProcessState.NONE,
};

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
                quoteRequestState: AsyncProcessState.SUCCESS,
            };
        case ActionTypes.SET_QUOTE_REQUEST_STATE_PENDING:
            return {
                ...state,
                latestBuyQuote: undefined,
                quoteRequestState: AsyncProcessState.PENDING,
            };
        case ActionTypes.SET_QUOTE_REQUEST_STATE_FAILURE:
            return {
                ...state,
                latestBuyQuote: undefined,
                quoteRequestState: AsyncProcessState.FAILURE,
            };
        case ActionTypes.UPDATE_BUY_ORDER_STATE:
            return {
                ...state,
                buyOrderState: action.data,
            };
        case ActionTypes.SET_ERROR_MESSAGE:
            return {
                ...state,
                latestErrorMessage: action.data,
                latestErrorDisplayStatus: DisplayStatus.Present,
            };
        case ActionTypes.HIDE_ERROR:
            return {
                ...state,
                latestErrorDisplayStatus: DisplayStatus.Hidden,
            };
        case ActionTypes.CLEAR_ERROR:
            return {
                ...state,
                latestErrorMessage: undefined,
                latestErrorDisplayStatus: DisplayStatus.Hidden,
            };
        case ActionTypes.UPDATE_SELECTED_ASSET:
            const newSelectedAssetData = action.data;
            let newSelectedAsset: Asset | undefined;
            if (!_.isUndefined(newSelectedAssetData)) {
                newSelectedAsset = assetUtils.createAssetFromAssetData(
                    newSelectedAssetData,
                    state.assetMetaDataMap,
                    state.network,
                );
            }
            return {
                ...state,
                selectedAsset: newSelectedAsset,
            };
        case ActionTypes.RESET_AMOUNT:
            return {
                ...state,
                latestBuyQuote: undefined,
                quoteRequestState: AsyncProcessState.NONE,
                buyOrderState: { processState: OrderProcessState.NONE },
                selectedAssetAmount: undefined,
            };
        default:
            return state;
    }
};
