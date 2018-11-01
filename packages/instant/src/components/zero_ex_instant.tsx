import { AssetBuyer } from '@0x/asset-buyer';
import { ObjectMap, SignedOrder } from '@0x/types';
import * as _ from 'lodash';
import * as React from 'react';
import { Provider } from 'react-redux';

import { SelectedAssetThemeProvider } from '../containers/selected_asset_theme_provider';
import { asyncData } from '../redux/async_data';
import { INITIAL_STATE, State } from '../redux/reducer';
import { store, Store } from '../redux/store';
import { fonts } from '../style/fonts';
import { AssetMetaData, Network } from '../types';
import { assetUtils } from '../util/asset';
import { BigNumberInput } from '../util/big_number_input';
import { errorFlasher } from '../util/error_flasher';
import { gasPriceEstimator } from '../util/gas_price_estimator';
import { getProvider } from '../util/provider';
import { web3Wrapper } from '../util/web3_wrapper';

import { ZeroExInstantContainer } from './zero_ex_instant_container';

fonts.include();

export type ZeroExInstantProps = ZeroExInstantRequiredProps & Partial<ZeroExInstantOptionalProps>;

export interface ZeroExInstantRequiredProps {
    orderSource: string | SignedOrder[];
}

export interface ZeroExInstantOptionalProps {
    availableAssetDatas: string[];
    defaultAssetBuyAmount?: number;
    defaultSelectedAssetData?: string;
    additionalAssetMetaDataMap: ObjectMap<AssetMetaData>;
    networkId: Network;
}

export class ZeroExInstant extends React.Component<ZeroExInstantProps> {
    private readonly _store: Store;
    // TODO(fragosti): Write tests for this beast once we inject a provider.
    private static _mergeInitialStateWithProps(props: ZeroExInstantProps, state: State = INITIAL_STATE): State {
        const networkId = props.networkId || state.network;
        // TODO: Provider needs to not be hard-coded to injected web3.
        const provider = getProvider();
        const assetBuyerOptions = {
            networkId,
        };
        let assetBuyer;
        if (_.isString(props.orderSource)) {
            assetBuyer = AssetBuyer.getAssetBuyerForStandardRelayerAPIUrl(
                provider,
                props.orderSource,
                assetBuyerOptions,
            );
        } else {
            assetBuyer = AssetBuyer.getAssetBuyerForProvidedOrders(provider, props.orderSource, assetBuyerOptions);
        }
        const completeAssetMetaDataMap = {
            ...props.additionalAssetMetaDataMap,
            ...state.assetMetaDataMap,
        };
        const storeStateFromProps: State = {
            ...state,
            assetBuyer,
            network: networkId,
            selectedAsset: _.isUndefined(props.defaultSelectedAssetData)
                ? undefined
                : assetUtils.createAssetFromAssetDataOrThrow(
                      props.defaultSelectedAssetData,
                      completeAssetMetaDataMap,
                      networkId,
                  ),
            selectedAssetAmount: _.isUndefined(props.defaultAssetBuyAmount)
                ? state.selectedAssetAmount
                : new BigNumberInput(props.defaultAssetBuyAmount),
            availableAssets: _.isUndefined(props.availableAssetDatas)
                ? undefined
                : assetUtils.createAssetsFromAssetDatas(props.availableAssetDatas, completeAssetMetaDataMap, networkId),
            assetMetaDataMap: completeAssetMetaDataMap,
        };
        return storeStateFromProps;
    }
    constructor(props: ZeroExInstantProps) {
        super(props);
        const initialAppState = ZeroExInstant._mergeInitialStateWithProps(this.props, INITIAL_STATE);
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

        // warm up the gas price estimator cache just in case we can't
        // grab the gas price estimate when submitting the transaction
        // tslint:disable-next-line:no-floating-promises
        gasPriceEstimator.getFastAmountInWeiAsync();

        // tslint:disable-next-line:no-floating-promises
        this._flashErrorIfWrongNetwork();
    }

    public render(): React.ReactNode {
        return (
            <Provider store={this._store}>
                <SelectedAssetThemeProvider>
                    <ZeroExInstantContainer />
                </SelectedAssetThemeProvider>
            </Provider>
        );
    }

    private readonly _flashErrorIfWrongNetwork = async (): Promise<void> => {
        const msToShowError = 30000; // 30 seconds
        const network = this._store.getState().network;
        const networkOfProvider = await web3Wrapper.getNetworkIdAsync();
        if (network !== networkOfProvider) {
            const errorMessage = `Wrong network detected. Try switching to ${Network[network]}.`;
            errorFlasher.flashNewErrorMessage(this._store.dispatch, errorMessage, msToShowError);
        }
    };
}
