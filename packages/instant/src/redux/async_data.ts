import { AssetProxyId } from '@0x/types';
import * as _ from 'lodash';

import { BIG_NUMBER_ZERO } from '../constants';
import { AccountState, ERC20Asset } from '../types';
import { assetUtils } from '../util/asset';
import { buyQuoteUpdater } from '../util/buy_quote_updater';
import { coinbaseApi } from '../util/coinbase_api';
import { errorFlasher } from '../util/error_flasher';

import { actions } from './actions';
import { Store } from './store';

export const asyncData = {
    fetchEthPriceAndDispatchToStore: async (store: Store) => {
        try {
            const ethUsdPrice = await coinbaseApi.getEthUsdPrice();
            store.dispatch(actions.updateEthUsdPrice(ethUsdPrice));
        } catch (e) {
            const errorMessage = 'Error fetching ETH/USD price';
            errorFlasher.flashNewErrorMessage(store.dispatch, errorMessage);
            store.dispatch(actions.updateEthUsdPrice(BIG_NUMBER_ZERO));
        }
    },
    fetchAvailableAssetDatasAndDispatchToStore: async (store: Store) => {
        const { providerState, assetMetaDataMap, network } = store.getState();
        const assetBuyer = providerState.assetBuyer;
        try {
            const assetDatas = await assetBuyer.getAvailableAssetDatasAsync();
            const assets = assetUtils.createAssetsFromAssetDatas(assetDatas, assetMetaDataMap, network);
            store.dispatch(actions.setAvailableAssets(assets));
        } catch (e) {
            const errorMessage = 'Could not find any assets';
            errorFlasher.flashNewErrorMessage(store.dispatch, errorMessage);
            // On error, just specify that none are available
            store.dispatch(actions.setAvailableAssets([]));
        }
    },
    fetchAccountInfoAndDispatchToStore: async (store: Store) => {
        const { providerState } = store.getState();
        const web3Wrapper = providerState.web3Wrapper;
        if (providerState.account.state !== AccountState.Loading) {
            store.dispatch(actions.setAccountStateLoading());
        }
        let availableAddresses: string[];
        try {
            availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
        } catch (e) {
            store.dispatch(actions.setAccountStateError());
            return;
        }
        if (!_.isEmpty(availableAddresses)) {
            const activeAddress = availableAddresses[0];
            store.dispatch(actions.setAccountStateReady(activeAddress));
            // tslint:disable-next-line:no-floating-promises
            asyncData.fetchAccountBalanceAndDispatchToStore(store);
        } else {
            store.dispatch(actions.setAccountStateLocked());
        }
    },
    fetchAccountBalanceAndDispatchToStore: async (store: Store) => {
        const { providerState } = store.getState();
        const web3Wrapper = providerState.web3Wrapper;
        const account = providerState.account;
        if (account.state !== AccountState.Ready) {
            return;
        }
        try {
            const address = account.address;
            const ethBalanceInWei = await web3Wrapper.getBalanceInWeiAsync(address);
            store.dispatch(actions.updateAccountEthBalance({ address, ethBalanceInWei }));
        } catch (e) {
            // leave balance as is
            return;
        }
    },
    fetchCurrentBuyQuoteAndDispatchToStore: async (store: Store) => {
        const { providerState, selectedAsset, selectedAssetAmount, affiliateInfo } = store.getState();
        const assetBuyer = providerState.assetBuyer;
        if (
            !_.isUndefined(selectedAssetAmount) &&
            !_.isUndefined(selectedAsset) &&
            selectedAsset.metaData.assetProxyId === AssetProxyId.ERC20
        ) {
            await buyQuoteUpdater.updateBuyQuoteAsync(
                assetBuyer,
                store.dispatch,
                selectedAsset as ERC20Asset,
                selectedAssetAmount,
                affiliateInfo,
            );
        }
    },
};
