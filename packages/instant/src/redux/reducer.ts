import { BuyQuote } from '@0x/asset-buyer';
import { AssetProxyId, ObjectMap } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { ERROR_ACCOUNT, LOADING_ACCOUNT, LOCKED_ACCOUNT } from '../constants';
import { assetMetaDataMap } from '../data/asset_meta_data_map';
import {
    Account,
    AccountReady,
    AccountState,
    AffiliateInfo,
    Asset,
    AssetMetaData,
    AsyncProcessState,
    DisplayStatus,
    Network,
    OrderProcessState,
    OrderState,
    ProviderState,
} from '../types';

import { Action, ActionTypes } from './actions';

// State that is required and we have defaults for, before props are passed in
export interface DefaultState {
    network: Network;
    assetMetaDataMap: ObjectMap<AssetMetaData>;
    buyOrderState: OrderState;
    latestErrorDisplayStatus: DisplayStatus;
    quoteRequestState: AsyncProcessState;
}

// State that is required but needs to be derived from the props
interface PropsDerivedState {
    providerState: ProviderState;
}

// State that is optional
interface OptionalState {
    selectedAsset: Asset;
    availableAssets: Asset[];
    selectedAssetAmount: BigNumber;
    ethUsdPrice: BigNumber;
    latestBuyQuote: BuyQuote;
    latestErrorMessage: string;
    affiliateInfo: AffiliateInfo;
}

export type State = DefaultState & PropsDerivedState & Partial<OptionalState>;

export const DEFAULT_STATE: DefaultState = {
    network: Network.Mainnet,
    assetMetaDataMap,
    buyOrderState: { processState: OrderProcessState.None },
    latestErrorDisplayStatus: DisplayStatus.Hidden,
    quoteRequestState: AsyncProcessState.None,
};

export const createReducer = (initialState: State) => {
    const reducer = (state: State = initialState, action: Action): State => {
        switch (action.type) {
            case ActionTypes.SET_ACCOUNT_STATE_LOADING:
                return reduceStateWithAccount(state, LOADING_ACCOUNT);
            case ActionTypes.SET_ACCOUNT_STATE_LOCKED:
                return reduceStateWithAccount(state, LOCKED_ACCOUNT);
            case ActionTypes.SET_ACCOUNT_STATE_ERROR:
                return reduceStateWithAccount(state, ERROR_ACCOUNT);
            case ActionTypes.SET_ACCOUNT_STATE_READY: {
                const account: AccountReady = {
                    state: AccountState.Ready,
                    address: action.data,
                };
                return reduceStateWithAccount(state, account);
            }
            case ActionTypes.UPDATE_ACCOUNT_ETH_BALANCE: {
                const { address, ethBalanceInWei } = action.data;
                const currentAccount = state.providerState.account;
                if (currentAccount.state !== AccountState.Ready || currentAccount.address !== address) {
                    return state;
                } else {
                    const newAccount: AccountReady = {
                        ...currentAccount,
                        ethBalanceInWei,
                    };
                    return reduceStateWithAccount(state, newAccount);
                }
            }
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
                        quoteRequestState: AsyncProcessState.Success,
                    };
                } else {
                    return state;
                }
            case ActionTypes.SET_QUOTE_REQUEST_STATE_PENDING:
                return {
                    ...state,
                    latestBuyQuote: undefined,
                    quoteRequestState: AsyncProcessState.Pending,
                };
            case ActionTypes.SET_QUOTE_REQUEST_STATE_FAILURE:
                return {
                    ...state,
                    latestBuyQuote: undefined,
                    quoteRequestState: AsyncProcessState.Failure,
                };
            case ActionTypes.SET_BUY_ORDER_STATE_NONE:
                return {
                    ...state,
                    buyOrderState: { processState: OrderProcessState.None },
                };
            case ActionTypes.SET_BUY_ORDER_STATE_VALIDATING:
                return {
                    ...state,
                    buyOrderState: { processState: OrderProcessState.Validating },
                };
            case ActionTypes.SET_BUY_ORDER_STATE_PROCESSING:
                const processingData = action.data;
                const { startTimeUnix, expectedEndTimeUnix } = processingData;
                return {
                    ...state,
                    buyOrderState: {
                        processState: OrderProcessState.Processing,
                        txHash: processingData.txHash,
                        progress: {
                            startTimeUnix,
                            expectedEndTimeUnix,
                        },
                    },
                };
            case ActionTypes.SET_BUY_ORDER_STATE_FAILURE:
                const failureTxHash = action.data;
                if ('txHash' in state.buyOrderState) {
                    if (state.buyOrderState.txHash === failureTxHash) {
                        const { txHash, progress } = state.buyOrderState;
                        return {
                            ...state,
                            buyOrderState: {
                                processState: OrderProcessState.Failure,
                                txHash,
                                progress,
                            },
                        };
                    }
                }
                return state;
            case ActionTypes.SET_BUY_ORDER_STATE_SUCCESS:
                const successTxHash = action.data;
                if ('txHash' in state.buyOrderState) {
                    if (state.buyOrderState.txHash === successTxHash) {
                        const { txHash, progress } = state.buyOrderState;
                        return {
                            ...state,
                            buyOrderState: {
                                processState: OrderProcessState.Success,
                                txHash,
                                progress,
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
                return {
                    ...state,
                    selectedAsset: action.data,
                };
            case ActionTypes.RESET_AMOUNT:
                return {
                    ...state,
                    latestBuyQuote: undefined,
                    quoteRequestState: AsyncProcessState.None,
                    buyOrderState: { processState: OrderProcessState.None },
                    selectedAssetAmount: undefined,
                };
            case ActionTypes.SET_AVAILABLE_ASSETS:
                return {
                    ...state,
                    availableAssets: action.data,
                };
            default:
                return state;
        }
    };
    return reducer;
};

const reduceStateWithAccount = (state: State, account: Account) => {
    const oldProviderState = state.providerState;
    const newProviderState: ProviderState = {
        ...oldProviderState,
        account,
    };
    return {
        ...state,
        providerState: newProviderState,
    };
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
