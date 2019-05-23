import { AssetProxyId } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import { Middleware } from 'redux';

import { ETH_DECIMALS } from '../constants';
import { AccountState, StandardSlidingPanelContent } from '../types';
import { analytics, AnalyticsEventOptions } from '../util/analytics';

import { Action, ActionTypes } from './actions';

import { State } from './reducer';

export const analyticsMiddleware: Middleware = store => next => middlewareAction => {
    const prevState = store.getState() as State;
    const prevAccount = prevState.providerState.account;

    const nextAction = next(middlewareAction) as Action;

    const curState = store.getState() as State;
    const curAccount = curState.providerState.account;

    switch (nextAction.type) {
        case ActionTypes.SetAccountStateReady:
            if (curAccount.state === AccountState.Ready) {
                const didJustTurnReady = prevAccount.state !== AccountState.Ready;
                const didJustUpdateAddress =
                    prevAccount.state === AccountState.Ready && prevAccount.address !== curAccount.address;
                const ethAddress = curAccount.address;
                if (didJustTurnReady) {
                    analytics.trackAccountReady(ethAddress);
                    analytics.addUserProperties({ lastKnownEthAddress: ethAddress });
                    analytics.addEventProperties({ ethAddress });
                } else if (didJustUpdateAddress) {
                    analytics.trackAccountAddressChanged(ethAddress);
                    analytics.addUserProperties({ lastKnownEthAddress: ethAddress });
                    analytics.addEventProperties({ ethAddress });
                }
            }
            break;
        case ActionTypes.SetAccountStateLocked:
            if (prevAccount.state !== AccountState.Locked && curAccount.state === AccountState.Locked) {
                // if we are moving from account not locked to account locked, track `Account - Locked`
                analytics.trackAccountLocked();
            }
            break;
        case ActionTypes.UpdateAccountEthBalance:
            if (
                curAccount.state === AccountState.Ready &&
                curAccount.ethBalanceInWei &&
                !_.isEqual(curAccount, prevAccount)
            ) {
                const ethBalanceInUnitAmount = Web3Wrapper.toUnitAmount(
                    curAccount.ethBalanceInWei,
                    ETH_DECIMALS,
                ).toString();
                analytics.addUserProperties({ lastEthBalanceInUnitAmount: ethBalanceInUnitAmount });
                analytics.addEventProperties({ ethBalanceInUnitAmount });
            }
            break;
        case ActionTypes.UpdateSelectedAsset:
            const selectedAsset = curState.selectedAsset;
            if (selectedAsset) {
                const assetName = selectedAsset.metaData.name;
                const assetData = selectedAsset.assetData;
                analytics.trackTokenSelectorChose({
                    assetName,
                    assetData,
                });

                const selectedAssetEventProperties: AnalyticsEventOptions = {
                    selectedAssetName: assetName,
                    selectedAssetData: assetData,
                };
                if (selectedAsset.metaData.assetProxyId === AssetProxyId.ERC20) {
                    selectedAssetEventProperties.selectedAssetDecimals = selectedAsset.metaData.decimals;
                    selectedAssetEventProperties.selectedAssetSymbol = selectedAsset.metaData.symbol;
                }
                analytics.addEventProperties(selectedAssetEventProperties);
            }
            break;
        case ActionTypes.SetAvailableAssets:
            const availableAssets = curState.availableAssets;
            if (availableAssets) {
                analytics.addEventProperties({
                    numberAvailableAssets: availableAssets.length,
                });
            }
            break;
        case ActionTypes.OpenStandardSlidingPanel:
            const openSlidingContent = curState.standardSlidingPanelSettings.content;
            if (openSlidingContent === StandardSlidingPanelContent.InstallWallet) {
                analytics.trackInstallWalletModalOpened();
            }
            break;
        case ActionTypes.CloseStandardSlidingPanel:
            const closeSlidingContent = curState.standardSlidingPanelSettings.content;
            if (closeSlidingContent === StandardSlidingPanelContent.InstallWallet) {
                analytics.trackInstallWalletModalClosed();
            }
            break;
        case ActionTypes.UpdateBaseCurrency:
            analytics.trackBaseCurrencyChanged(curState.baseCurrency);
            analytics.addEventProperties({ baseCurrency: curState.baseCurrency });
    }

    return nextAction;
};
