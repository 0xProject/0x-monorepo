import { AssetBuyer } from '@0x/asset-buyer';
import { ObjectMap } from '@0x/types';
import * as React from 'react';
import { Provider } from 'react-redux';

import { SelectedAssetThemeProvider } from '../containers/selected_asset_theme_provider';
import { assetMetaDataMap } from '../data/asset_meta_data_map';
import { asyncData } from '../redux/async_data';
import { State } from '../redux/reducer';
import { store, Store } from '../redux/store';
import { fonts } from '../style/fonts';
import { AssetMetaData } from '../types';
import { assetUtils } from '../util/asset';
import { getProvider } from '../util/provider';

import { ZeroExInstantContainer } from './zero_ex_instant_container';

fonts.include();

export interface ZeroExInstantProps {
    // TODO: Change API when we allow the selection of different assetDatas
    assetData: string;
    sraApiUrl: string;
    additionalAssetMetaDataMap: ObjectMap<AssetMetaData>;
}

export class ZeroExInstant extends React.Component<ZeroExInstantProps> {
    public static defaultProps = {
        additionalAssetMetaDataMap: {},
    };
    public store: Store;
    private static _createPartialStoreStateFromProps(props: ZeroExInstantProps): Partial<State> {
        // TODO: Provider needs to not be hard-coded to injected web3.
        const assetBuyer = AssetBuyer.getAssetBuyerForStandardRelayerAPIUrl(getProvider(), props.sraApiUrl);
        const completeAssetMetaDataMap = {
            ...props.additionalAssetMetaDataMap,
            ...assetMetaDataMap,
        };
        const storeStateFromProps: Partial<State> = {
            assetBuyer,
            selectedAsset: assetUtils.createAssetFromAssetData(props.assetData, completeAssetMetaDataMap),
            assetMetaDataMap: completeAssetMetaDataMap,
        };
        return storeStateFromProps;
    }
    constructor(props: ZeroExInstantProps) {
        super(props);
        this.store = store.create(ZeroExInstant._createPartialStoreStateFromProps(this.props));
        // tslint:disable-next-line:no-floating-promises
        asyncData.fetchAndDispatchToStore(this.store);
    }

    public render(): React.ReactNode {
        return (
            <Provider store={this.store}>
                <SelectedAssetThemeProvider>
                    <ZeroExInstantContainer />
                </SelectedAssetThemeProvider>
            </Provider>
        );
    }
}
