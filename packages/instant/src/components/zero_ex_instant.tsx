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
    // TODO: Change API when we allow the selection of different assetDatas
    assetData: string;
    liquiditySource: string | SignedOrder[];
}

export interface ZeroExInstantOptionalProps {
    defaultAssetBuyAmount?: number;
    additionalAssetMetaDataMap: ObjectMap<AssetMetaData>;
    networkId: Network;
}

export class ZeroExInstant extends React.Component<ZeroExInstantProps> {
    private readonly _store: Store;
    private static _mergeInitialStateWithProps(props: ZeroExInstantProps, state: State = INITIAL_STATE): State {
        const networkId = props.networkId || state.network;
        // TODO: Provider needs to not be hard-coded to injected web3.
        const provider = getProvider();
        const assetBuyerOptions = {
            networkId,
        };
        let assetBuyer;
        if (_.isString(props.liquiditySource)) {
            assetBuyer = AssetBuyer.getAssetBuyerForStandardRelayerAPIUrl(
                provider,
                props.liquiditySource,
                assetBuyerOptions,
            );
        } else {
            assetBuyer = AssetBuyer.getAssetBuyerForProvidedOrders(provider, props.liquiditySource, assetBuyerOptions);
        }
        const completeAssetMetaDataMap = {
            ...props.additionalAssetMetaDataMap,
            ...state.assetMetaDataMap,
        };
        const storeStateFromProps: State = {
            ...state,
            assetBuyer,
            network: networkId,
            selectedAsset: assetUtils.createAssetFromAssetData(props.assetData, completeAssetMetaDataMap, networkId),
            selectedAssetAmount: _.isUndefined(props.defaultAssetBuyAmount)
                ? state.selectedAssetAmount
                : new BigNumberInput(props.defaultAssetBuyAmount),
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
        // tslint:disable-next-line:no-floating-promises
        asyncData.fetchAndDispatchToStore(this._store);
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
