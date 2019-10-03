import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import { Dispatch } from 'redux';

import { BIG_NUMBER_ZERO } from '../constants';
import { AccountState, BaseCurrency, OrderProcessState, ProviderState, QuoteFetchOrigin } from '../types';
import { analytics } from '../util/analytics';
import { assetUtils } from '../util/asset';
import { buyQuoteUpdater } from '../util/buy_quote_updater';
import { coinbaseApi } from '../util/coinbase_api';
import { errorFlasher } from '../util/error_flasher';
import { errorReporter } from '../util/error_reporter';

import { actions } from './actions';
import { State } from './reducer';

export const asyncData = {
    fetchEthPriceAndDispatchToStore: async (dispatch: Dispatch) => {
        try {
            const ethUsdPrice = await coinbaseApi.getEthUsdPrice();
            dispatch(actions.updateEthUsdPrice(ethUsdPrice));
        } catch (e) {
            const errorMessage = 'Error fetching ETH/USD price';
            errorFlasher.flashNewErrorMessage(dispatch, errorMessage);
            dispatch(actions.updateEthUsdPrice(BIG_NUMBER_ZERO));
            dispatch(actions.updateBaseCurrency(BaseCurrency.ETH));
            errorReporter.report(e);
            analytics.trackUsdPriceFailed();
        }
    },
    fetchAvailableAssetDatasAndDispatchToStore: async (state: State, dispatch: Dispatch) => {
        const { providerState, assetMetaDataMap, network } = state;
        const assetBuyer = providerState.assetBuyer;
        try {
            const assetDatas = await assetBuyer.getAvailableAssetDatasAsync();
            const deduplicatedAssetDatas = _.uniq(assetDatas);
            const assets = assetUtils.createAssetsFromAssetDatas(deduplicatedAssetDatas, assetMetaDataMap, network);
            dispatch(actions.setAvailableAssets(assets));
        } catch (e) {
            const errorMessage = 'Could not find any assets';
            errorFlasher.flashNewErrorMessage(dispatch, errorMessage);
            // On error, just specify that none are available
            dispatch(actions.setAvailableAssets([]));
            errorReporter.report(e);
        }
    },
    fetchAccountInfoAndDispatchToStore: async (
        providerState: ProviderState,
        dispatch: Dispatch,
        shouldAttemptUnlock: boolean = false,
        shouldSetToLoading: boolean = false,
    ) => {
        const web3Wrapper = providerState.web3Wrapper;
        const provider = providerState.provider;
        if (shouldSetToLoading && providerState.account.state !== AccountState.Loading) {
            dispatch(actions.setAccountStateLoading());
        }
        let availableAddresses: string[] = [];
        try {
            // TODO(bmillman): Add support at the web3Wrapper level for calling `eth_requestAccounts` instead of calling enable here
            const isPrivacyModeEnabled = (provider as any).enable !== undefined;
            if (providerState.name !== 'Fortmatic') {
                availableAddresses =
                    isPrivacyModeEnabled && shouldAttemptUnlock
                        ? await (provider as any).enable()
                        : await web3Wrapper.getAvailableAddressesAsync();
            } else {
                // If the provider is fortmatic don't try to get available addresses or it will prompt the user all the time on the heartbeat
                if (shouldAttemptUnlock) {
                    availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
                }
            }
        } catch (e) {
            analytics.trackAccountUnlockDenied();
            dispatch(actions.setAccountStateLocked());
            return;
        }
        if (!_.isEmpty(availableAddresses)) {
            const activeAddress = availableAddresses[0];
            dispatch(actions.setAccountStateReady(activeAddress));
            // tslint:disable-next-line:no-floating-promises
            asyncData.fetchAccountBalanceAndDispatchToStore(activeAddress, providerState.web3Wrapper, dispatch);
        } else {
            dispatch(actions.setAccountStateLocked());
        }
    },
    fetchAccountBalanceAndDispatchToStore: async (address: string, web3Wrapper: Web3Wrapper, dispatch: Dispatch) => {
        try {
            const ethBalanceInWei = await web3Wrapper.getBalanceInWeiAsync(address);
            dispatch(actions.updateAccountEthBalance({ address, ethBalanceInWei }));
        } catch (e) {
            errorReporter.report(e);
            // leave balance as is
            return;
        }
    },
    fetchCurrentBuyQuoteAndDispatchToStore: async (
        state: State,
        dispatch: Dispatch,
        fetchOrigin: QuoteFetchOrigin,
        options: { updateSilently: boolean },
    ) => {
        const { buyOrderState, providerState, selectedAsset, selectedAssetUnitAmount, affiliateInfo } = state;
        const assetBuyer = providerState.assetBuyer;
        if (
            selectedAssetUnitAmount !== undefined &&
            selectedAsset !== undefined &&
            selectedAssetUnitAmount.isGreaterThan(BIG_NUMBER_ZERO) &&
            buyOrderState.processState === OrderProcessState.None
        ) {
            await buyQuoteUpdater.updateBuyQuoteAsync(
                assetBuyer,
                dispatch,
                selectedAsset,
                selectedAssetUnitAmount,
                fetchOrigin,
                {
                    setPending: !options.updateSilently,
                    dispatchErrors: !options.updateSilently,
                    affiliateInfo,
                },
            );
        }
    },
};
