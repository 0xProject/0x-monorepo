import { ObjectMap } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';
import * as React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { SelectedAssetThemeProvider } from '../containers/selected_asset_theme_provider';
import { asyncData } from '../redux/async_data';
import { DEFAULT_STATE, DefaultState, State } from '../redux/reducer';
import { store, Store } from '../redux/store';
import { fonts } from '../style/fonts';
import { AffiliateInfo, AssetMetaData, Network, OrderSource } from '../types';
import { assetUtils } from '../util/asset';
import { errorFlasher } from '../util/error_flasher';
import { gasPriceEstimator } from '../util/gas_price_estimator';
import { providerStateFactory } from '../util/provider_state_factory';

fonts.include();

export type ZeroExInstantProviderProps = ZeroExInstantProviderRequiredProps &
    Partial<ZeroExInstantProviderOptionalProps>;

export interface ZeroExInstantProviderRequiredProps {
    orderSource: OrderSource;
}

export interface ZeroExInstantProviderOptionalProps {
    provider: Provider;
    availableAssetDatas: string[];
    defaultAssetBuyAmount: number;
    defaultSelectedAssetData: string;
    additionalAssetMetaDataMap: ObjectMap<AssetMetaData>;
    networkId: Network;
    affiliateInfo: AffiliateInfo;
}

export class ZeroExInstantProvider extends React.Component<ZeroExInstantProviderProps> {
    private readonly _store: Store;
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
        );
        // merge the additional additionalAssetMetaDataMap with our default map
        const completeAssetMetaDataMap = {
            ...props.additionalAssetMetaDataMap,
            ...defaultState.assetMetaDataMap,
        };
        // construct the final state
        const storeStateFromProps: State = {
            ...defaultState,
            providerState,
            network: networkId,
            selectedAsset: _.isUndefined(props.defaultSelectedAssetData)
                ? undefined
                : assetUtils.createAssetFromAssetDataOrThrow(
                      props.defaultSelectedAssetData,
                      completeAssetMetaDataMap,
                      networkId,
                  ),
            selectedAssetAmount: _.isUndefined(props.defaultAssetBuyAmount)
                ? undefined
                : new BigNumber(props.defaultAssetBuyAmount),
            availableAssets: _.isUndefined(props.availableAssetDatas)
                ? undefined
                : assetUtils.createAssetsFromAssetDatas(props.availableAssetDatas, completeAssetMetaDataMap, networkId),
            assetMetaDataMap: completeAssetMetaDataMap,
            affiliateInfo: props.affiliateInfo,
        };
        return storeStateFromProps;
    }
    constructor(props: ZeroExInstantProviderProps) {
        super(props);
        const initialAppState = ZeroExInstantProvider._mergeDefaultStateWithProps(this.props);
        this._store = store.create(initialAppState);
    }
    public componentDidMount(): void {
        const state = this._store.getState();
        // tslint:disable-next-line:no-floating-promises
        asyncData.fetchEthPriceAndDispatchToStore(this._store);
        // fetch available assets if none are specified
        if (_.isUndefined(state.availableAssets)) {
            // tslint:disable-next-line:no-floating-promises
            asyncData.fetchAvailableAssetDatasAndDispatchToStore(this._store);
        }
        // tslint:disable-next-line:no-floating-promises
        asyncData.fetchAccountInfoAndDispatchToStore(this._store);
        // tslint:disable-next-line:no-floating-promises
        asyncData.fetchCurrentBuyQuoteAndDispatchToStore(this._store);
        // warm up the gas price estimator cache just in case we can't
        // grab the gas price estimate when submitting the transaction
        // tslint:disable-next-line:no-floating-promises
        gasPriceEstimator.getGasInfoAsync();
        // tslint:disable-next-line:no-floating-promises
        this._flashErrorIfWrongNetwork();
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
