import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { ACCOUNT_UPDATE_INTERVAL_TIME_MS, SWAP_QUOTE_UPDATE_INTERVAL_TIME_MS } from '../constants';
import { SelectedAssetThemeProvider } from '../containers/selected_asset_theme_provider';
import { asyncData } from '../redux/async_data';
import { DEFAULT_STATE, DefaultState, State } from '../redux/reducer';
import { store, Store } from '../redux/store';
import { fonts } from '../style/fonts';
import { AccountState, Network, QuoteFetchOrigin, ZeroExInstantBaseConfig } from '../types';
import { analytics, disableAnalytics } from '../util/analytics';
import { assetUtils } from '../util/asset';
import { errorFlasher } from '../util/error_flasher';
import { setupRollbar } from '../util/error_reporter';
import { gasPriceEstimator } from '../util/gas_price_estimator';
import { Heartbeater } from '../util/heartbeater';
import { generateAccountHeartbeater, generateSwapQuoteHeartbeater } from '../util/heartbeater_factory';
import { providerStateFactory } from '../util/provider_state_factory';

export type ZeroExInstantProviderProps = ZeroExInstantBaseConfig;

export class ZeroExInstantProvider extends React.PureComponent<ZeroExInstantProviderProps> {
    private readonly _store: Store;
    private _accountUpdateHeartbeat?: Heartbeater;
    private _swapQuoteHeartbeat?: Heartbeater;

    // TODO(fragosti): Write tests for this beast once we inject a provider.
    private static _mergeDefaultStateWithProps(
        props: ZeroExInstantProviderProps,
        defaultState: DefaultState = DEFAULT_STATE,
    ): State {
        // use the networkId passed in with the props, otherwise default to that of the default state (1, mainnet)
        const networkId = props.networkId || defaultState.network;
        // construct the ProviderState
        const providerState = providerStateFactory.getInitialProviderState(
            props.orderSource,
            networkId,
            props.provider,
            props.walletDisplayName,
        );
        // merge the additional additionalAssetMetaDataMap with our default map
        const completeAssetMetaDataMap = {
            // Make sure the passed in assetDatas are lower case
            ..._.mapKeys(props.additionalAssetMetaDataMap || {}, (value, key) => key.toLowerCase()),
            ...defaultState.assetMetaDataMap,
        };

        const selectedAsset =
            props.defaultSelectedAssetData === undefined
                ? undefined
                : assetUtils.createAssetFromAssetDataOrThrow(
                      props.defaultSelectedAssetData,
                      completeAssetMetaDataMap,
                      networkId,
                  );

        let selectedAssetUnitAmount: BigNumber | undefined;
        if (selectedAsset !== undefined) {
            if (selectedAsset.metaData.assetProxyId === AssetProxyId.ERC20) {
                selectedAssetUnitAmount =
                    props.defaultAssetBuyAmount === undefined ? undefined : new BigNumber(props.defaultAssetBuyAmount);
            } else if (selectedAsset.metaData.assetProxyId === AssetProxyId.ERC721) {
                selectedAssetUnitAmount = new BigNumber(1);
            }
        }

        // construct the final state
        const storeStateFromProps: State = {
            ...defaultState,
            providerState,
            network: networkId,
            walletDisplayName: props.walletDisplayName,
            selectedAsset,
            selectedAssetUnitAmount,
            availableAssets:
                props.availableAssetDatas === undefined
                    ? undefined
                    : assetUtils.createAssetsFromAssetDatas(
                          props.availableAssetDatas,
                          completeAssetMetaDataMap,
                          networkId,
                      ),
            assetMetaDataMap: completeAssetMetaDataMap,
            onSuccess: props.onSuccess,
            affiliateInfo: props.affiliateInfo,
        };
        return storeStateFromProps;
    }
    constructor(props: ZeroExInstantProviderProps) {
        super(props);
        setupRollbar();
        fonts.include();
        const initialAppState = ZeroExInstantProvider._mergeDefaultStateWithProps(this.props);
        this._store = store.create(initialAppState);
    }
    public componentDidMount(): void {
        const state = this._store.getState();
        const dispatch = this._store.dispatch;
        // tslint:disable-next-line:no-floating-promises
        asyncData.fetchEthPriceAndDispatchToStore(dispatch);
        // fetch available assets if none are specified
        if (state.availableAssets === undefined) {
            // tslint:disable-next-line:no-floating-promises
            asyncData.fetchAvailableAssetDatasAndDispatchToStore(state, dispatch);
        }
        if (state.providerState.account.state !== AccountState.None) {
            this._accountUpdateHeartbeat = generateAccountHeartbeater({
                store: this._store,
                shouldPerformImmediatelyOnStart: true,
            });
            this._accountUpdateHeartbeat.start(ACCOUNT_UPDATE_INTERVAL_TIME_MS);
        }

        this._swapQuoteHeartbeat = generateSwapQuoteHeartbeater({
            store: this._store,
            shouldPerformImmediatelyOnStart: false,
        });
        this._swapQuoteHeartbeat.start(SWAP_QUOTE_UPDATE_INTERVAL_TIME_MS);
        // Trigger first buyquote fetch
        // tslint:disable-next-line:no-floating-promises
        asyncData.fetchCurrentSwapQuoteAndDispatchToStore(state, dispatch, QuoteFetchOrigin.Manual, {
            updateSilently: false,
        });
        // warm up the gas price estimator cache just in case we can't
        // grab the gas price estimate when submitting the transaction
        // tslint:disable-next-line:no-floating-promises
        gasPriceEstimator.getGasInfoAsync();
        // tslint:disable-next-line:no-floating-promises
        this._flashErrorIfWrongNetwork();

        // Analytics
        disableAnalytics(this.props.shouldDisableAnalyticsTracking || false);
        analytics.addEventProperties(
            analytics.generateEventProperties(
                state.network,
                this.props.orderSource,
                state.providerState,
                window,
                state.selectedAsset,
                this.props.affiliateInfo,
                state.baseCurrency,
            ),
        );
        analytics.trackInstantOpened();
    }
    public componentWillUnmount(): void {
        if (this._accountUpdateHeartbeat) {
            this._accountUpdateHeartbeat.stop();
        }
        if (this._swapQuoteHeartbeat) {
            this._swapQuoteHeartbeat.stop();
        }
    }
    public render(): React.ReactNode {
        return (
            <ReduxProvider store={this._store}>
                <SelectedAssetThemeProvider>{this.props.children}</SelectedAssetThemeProvider>
            </ReduxProvider>
        );
    }
    private readonly _flashErrorIfWrongNetwork = async (): Promise<void> => {
        const msToShowError = 30000; // 30 seconds
        const state = this._store.getState();
        const network = state.network;
        const web3Wrapper = state.providerState.web3Wrapper;
        const networkOfProvider = await web3Wrapper.getNetworkIdAsync();
        if (network !== networkOfProvider) {
            const errorMessage = `Wrong network detected. Try switching to ${Network[network]}.`;
            errorFlasher.flashNewErrorMessage(this._store.dispatch, errorMessage, msToShowError);
        }
    };
}
