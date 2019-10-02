import { BuyQuote } from '@0x/asset-buyer';
import { AssetProxyId, ObjectMap } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { LOADING_ACCOUNT, LOCKED_ACCOUNT } from '../constants';
import { assetMetaDataMap } from '../data/asset_meta_data_map';
import {
    Account,
    AccountReady,
    AccountState,
    AffiliateInfo,
    Asset,
    AssetMetaData,
    AsyncProcessState,
    BaseCurrency,
    DisplayStatus,
    Network,
    OrderProcessState,
    OrderState,
    ProviderState,
    StandardSlidingPanelContent,
    StandardSlidingPanelSettings,
} from '../types';

import { Action, ActionTypes } from './actions';

// State that is required and we have defaults for, before props are passed in
export interface DefaultState {
    network: Network;
    assetMetaDataMap: ObjectMap<AssetMetaData>;
    buyOrderState: OrderState;
    latestErrorDisplayStatus: DisplayStatus;
    quoteRequestState: AsyncProcessState;
    standardSlidingPanelSettings: StandardSlidingPanelSettings;
    baseCurrency: BaseCurrency;
}

// State that is required but needs to be derived from the props
interface PropsDerivedState {
    providerState: ProviderState;
}

// State that is optional
interface OptionalState {
    selectedAsset: Asset;
    availableAssets: Asset[];
    selectedAssetUnitAmount: BigNumber;
    ethUsdPrice: BigNumber;
    latestBuyQuote: BuyQuote;
    latestErrorMessage: string;
    affiliateInfo: AffiliateInfo;
    walletDisplayName: string;
    onSuccess: (txHash: string) => void;
}

export type State = DefaultState & PropsDerivedState & Partial<OptionalState>;

export const DEFAULT_STATE: DefaultState = {
    network: Network.Mainnet,
    assetMetaDataMap,
    buyOrderState: { processState: OrderProcessState.None },
    latestErrorDisplayStatus: DisplayStatus.Hidden,
    quoteRequestState: AsyncProcessState.None,
    standardSlidingPanelSettings: {
        animationState: 'none',
        content: StandardSlidingPanelContent.None,
    },
    baseCurrency: BaseCurrency.USD,
};

export const createReducer = (initialState: State) => {
    const reducer = (state: State = initialState, action: Action): State => {
        switch (action.type) {
            case ActionTypes.SetAccountStateLoading:
                return reduceStateWithAccount(state, LOADING_ACCOUNT);
            case ActionTypes.SetAccountStateLocked:
                return reduceStateWithAccount(state, LOCKED_ACCOUNT);
            case ActionTypes.SetAccountStateReady: {
                const address = action.data;
                let newAccount: AccountReady = {
                    state: AccountState.Ready,
                    address,
                };
                const currentAccount = state.providerState.account;
                if (currentAccount.state === AccountState.Ready && currentAccount.address === address) {
                    newAccount = {
                        ...newAccount,
                        ethBalanceInWei: currentAccount.ethBalanceInWei,
                    };
                }
                return reduceStateWithAccount(state, newAccount);
            }
            case ActionTypes.UpdateAccountEthBalance: {
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
            case ActionTypes.UpdateEthUsdPrice:
                return {
                    ...state,
                    ethUsdPrice: action.data,
                };
            case ActionTypes.UpdateSelectedAssetUnitAmount:
                return {
                    ...state,
                    selectedAssetUnitAmount: action.data,
                };
            case ActionTypes.UpdateLatestBuyQuote:
                const newBuyQuoteIfExists = action.data;
                const shouldUpdate =
                    newBuyQuoteIfExists === undefined || doesBuyQuoteMatchState(newBuyQuoteIfExists, state);
                if (shouldUpdate) {
                    return {
                        ...state,
                        latestBuyQuote: newBuyQuoteIfExists,
                        quoteRequestState: AsyncProcessState.Success,
                    };
                } else {
                    return state;
                }
            case ActionTypes.SetQuoteRequestStatePending:
                return {
                    ...state,
                    latestBuyQuote: undefined,
                    quoteRequestState: AsyncProcessState.Pending,
                };
            case ActionTypes.SetQuoteRequestStateFailure:
                return {
                    ...state,
                    latestBuyQuote: undefined,
                    quoteRequestState: AsyncProcessState.Failure,
                };
            case ActionTypes.SetBuyOrderStateNone:
                return {
                    ...state,
                    buyOrderState: { processState: OrderProcessState.None },
                };
            case ActionTypes.SetBuyOrderStateValidating:
                return {
                    ...state,
                    buyOrderState: { processState: OrderProcessState.Validating },
                };
            case ActionTypes.SetBuyOrderStateProcessing:
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
            case ActionTypes.SetBuyOrderStateFailure:
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
            case ActionTypes.SetBuyOrderStateSuccess:
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
            case ActionTypes.SetErrorMessage:
                return {
                    ...state,
                    latestErrorMessage: action.data,
                    latestErrorDisplayStatus: DisplayStatus.Present,
                };
            case ActionTypes.HideError:
                return {
                    ...state,
                    latestErrorDisplayStatus: DisplayStatus.Hidden,
                };
            case ActionTypes.ClearError:
                return {
                    ...state,
                    latestErrorMessage: undefined,
                    latestErrorDisplayStatus: DisplayStatus.Hidden,
                };
            case ActionTypes.UpdateSelectedAsset:
                return {
                    ...state,
                    selectedAsset: action.data,
                };
            case ActionTypes.ResetAmount:
                return {
                    ...state,
                    latestBuyQuote: undefined,
                    quoteRequestState: AsyncProcessState.None,
                    buyOrderState: { processState: OrderProcessState.None },
                    selectedAssetUnitAmount: undefined,
                };
            case ActionTypes.SetAvailableAssets:
                return {
                    ...state,
                    availableAssets: action.data,
                };
            case ActionTypes.OpenStandardSlidingPanel:
                return {
                    ...state,
                    standardSlidingPanelSettings: {
                        content: action.data,
                        animationState: 'slidIn',
                    },
                };
            case ActionTypes.CloseStandardSlidingPanel:
                return {
                    ...state,
                    standardSlidingPanelSettings: {
                        content: state.standardSlidingPanelSettings.content,
                        animationState: 'slidOut',
                    },
                };
            case ActionTypes.UpdateBaseCurrency:
                return {
                    ...state,
                    baseCurrency: action.data,
                };
            case ActionTypes.SetProviderState:
                return {
                    ...state,
                    providerState: action.data,
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
    const selectedAssetUnitAmountIfExists = state.selectedAssetUnitAmount;
    // if no selectedAsset or selectedAssetAmount exists on the current state, return false
    if (selectedAssetIfExists === undefined || selectedAssetUnitAmountIfExists === undefined) {
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
            selectedAssetUnitAmountIfExists,
            selectedAssetMetaData.decimals,
        );
        const doesAssetAmountMatch = selectedAssetAmountBaseUnits.eq(buyQuote.assetBuyAmount);
        return doesAssetAmountMatch;
    } else {
        return true;
    }
};
