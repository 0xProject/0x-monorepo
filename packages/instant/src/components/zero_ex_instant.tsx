import { AssetBuyer } from '@0x/asset-buyer';
import { ObjectMap } from '@0x/types';
import * as React from 'react';
import { Provider } from 'react-redux';

import { SelectedAssetThemeProvider } from '../containers/selected_asset_theme_provider';
import { asyncData } from '../redux/async_data';
import { INITIAL_STATE, State } from '../redux/reducer';
import { store, Store } from '../redux/store';
import { fonts } from '../style/fonts';
import { AssetMetaData, Network } from '../types';
import { assetUtils } from '../util/asset';
import { getProvider } from '../util/provider';

import { ZeroExInstantContainer } from './zero_ex_instant_container';

fonts.include();

export type ZeroExInstantProps = ZeroExInstantRequiredProps & Partial<ZeroExInstantOptionalProps>;

export interface ZeroExInstantRequiredProps {
    // TODO: Change API when we allow the selection of different assetDatas
    assetData: string;
    // TODO: Allow for a function that returns orders
    liquiditySource: string;
}

export interface ZeroExInstantOptionalProps {
    additionalAssetMetaDataMap: ObjectMap<AssetMetaData>;
    network: Network;
}

export class ZeroExInstant extends React.Component<ZeroExInstantProps> {
    private readonly _store: Store;
    private static _mergeInitialStateWithProps(props: ZeroExInstantProps, state: State = INITIAL_STATE): State {
        // Create merged object such that properties in props override default settings
        const optionalPropsWithDefaults: ZeroExInstantOptionalProps = {
            additionalAssetMetaDataMap: props.additionalAssetMetaDataMap || {},
            network: props.network || state.network,
        };
        const { network } = optionalPropsWithDefaults;
        // TODO: Provider needs to not be hard-coded to injected web3.
        const assetBuyer = AssetBuyer.getAssetBuyerForStandardRelayerAPIUrl(getProvider(), props.liquiditySource, {
            networkId: network,
        });
        const completeAssetMetaDataMap = {
            ...props.additionalAssetMetaDataMap,
            ...state.assetMetaDataMap,
        };
        const storeStateFromProps: State = {
            ...state,
            assetBuyer,
            network,
            selectedAsset: assetUtils.createAssetFromAssetData(props.assetData, completeAssetMetaDataMap, network),
            assetMetaDataMap: completeAssetMetaDataMap,
        };
        return storeStateFromProps;
    }
    constructor(props: ZeroExInstantProps) {
        super(props);
        this._store = store.create(ZeroExInstant._mergeInitialStateWithProps(this.props, INITIAL_STATE));
        // tslint:disable-next-line:no-floating-promises
        asyncData.fetchAndDispatchToStore(this._store);
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
}
