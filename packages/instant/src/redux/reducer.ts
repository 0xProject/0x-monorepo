import { AssetBuyer, BuyQuote } from '@0x/asset-buyer';
import { AssetProxyId, ObjectMap } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
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
            const newBuyQuoteIfExists = action.data;
            const shouldUpdate =
                _.isUndefined(newBuyQuoteIfExists) || doesBuyQuoteMatchState(newBuyQuoteIfExists, state);
            if (shouldUpdate) {
                return {
                    ...state,
                    latestBuyQuote: newBuyQuoteIfExists,
                    quoteRequestState: AsyncProcessState.SUCCESS,
                };
            } else {
                return state;
            }

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
        case ActionTypes.SET_BUY_ORDER_STATE_NONE:
            return {
                ...state,
                buyOrderState: { processState: OrderProcessState.NONE },
            };
        case ActionTypes.SET_BUY_ORDER_STATE_VALIDATING:
            return {
                ...state,
                buyOrderState: { processState: OrderProcessState.VALIDATING },
            };
        case ActionTypes.SET_BUY_ORDER_STATE_PROCESSING:
            const processingData = action.data;
            const { startTimeUnix, expectedEndTimeUnix } = processingData;
            return {
                ...state,
                buyOrderState: {
                    processState: OrderProcessState.PROCESSING,
                    txHash: processingData.txHash,
                    progress: {
                        startTimeUnix,
                        expectedEndTimeUnix,
                        ended: false,
                    },
                },
            };
        case ActionTypes.SET_BUY_ORDER_STATE_FAILURE:
            const failureTxHash = action.data;
            if ('txHash' in state.buyOrderState) {
                if (state.buyOrderState.txHash === failureTxHash) {
                    const failureProgress = {
                        startTimeUnix: state.buyOrderState.progress.startTimeUnix,
                        expectedEndTimeUnix: state.buyOrderState.progress.expectedEndTimeUnix,
                        ended: true,
                    };
                    return {
                        ...state,
                        buyOrderState: {
                            processState: OrderProcessState.FAILURE,
                            txHash: state.buyOrderState.txHash,
                            progress: failureProgress,
                        },
                    };
                }
            }
            return state;
        case ActionTypes.SET_BUY_ORDER_STATE_SUCCESS:
            const successTxHash = action.data;
            if ('txHash' in state.buyOrderState) {
                if (state.buyOrderState.txHash === successTxHash) {
                    const successProgress = {
                        startTimeUnix: state.buyOrderState.progress.startTimeUnix,
                        expectedEndTimeUnix: state.buyOrderState.progress.expectedEndTimeUnix,
                        ended: true,
                    };
                    return {
                        ...state,
                        buyOrderState: {
                            processState: OrderProcessState.SUCCESS,
                            txHash: state.buyOrderState.txHash,
                            progress: successProgress,
                        },
                    };
                }
            }
            return state;
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

const doesBuyQuoteMatchState = (buyQuote: BuyQuote, state: State): boolean => {
    const selectedAssetIfExists = state.selectedAsset;
    const selectedAssetAmountIfExists = state.selectedAssetAmount;
    // if no selectedAsset or selectedAssetAmount exists on the current state, return false
    if (_.isUndefined(selectedAssetIfExists) || _.isUndefined(selectedAssetAmountIfExists)) {
        return false;
    }
    // if buyQuote's assetData does not match that of the current selected asset, return false
    if (selectedAssetIfExists.assetData !== buyQuote.assetData) {
        return false;
    }
    // if ERC20 and buyQuote's assetBuyAmount does not match selectedAssetAmount, return false
    // if ERC721, return true
    const selectedAssetMetaData = selectedAssetIfExists.metaData;
    if (selectedAssetMetaData.assetProxyId === AssetProxyId.ERC20) {
        const selectedAssetAmountBaseUnits = Web3Wrapper.toBaseUnitAmount(
            selectedAssetAmountIfExists,
            selectedAssetMetaData.decimals,
        );
        const doesAssetAmountMatch = selectedAssetAmountBaseUnits.eq(buyQuote.assetBuyAmount);
        return doesAssetAmountMatch;
    } else {
        return true;
    }
};
