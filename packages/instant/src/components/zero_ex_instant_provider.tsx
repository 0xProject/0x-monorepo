import { AssetBuyer } from '@0x/asset-buyer';
import { ObjectMap, SignedOrder } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';
import * as React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { oc } from 'ts-optchain';

import { SelectedAssetThemeProvider } from '../containers/selected_asset_theme_provider';
import { asyncData } from '../redux/async_data';
import { INITIAL_STATE, State } from '../redux/reducer';
import { store, Store } from '../redux/store';
import { fonts } from '../style/fonts';
import { AffiliateInfo, AssetMetaData, Network } from '../types';
import { assetUtils } from '../util/asset';
import { BigNumberInput } from '../util/big_number_input';
import { errorFlasher } from '../util/error_flasher';
import { gasPriceEstimator } from '../util/gas_price_estimator';
import { getInjectedProvider } from '../util/injected_provider';

fonts.include();

export type ZeroExInstantProviderProps = ZeroExInstantProviderRequiredProps &
    Partial<ZeroExInstantProviderOptionalProps>;

export interface ZeroExInstantProviderRequiredProps {
    // TODO: Change API when we allow the selection of different assetDatas
    assetData: string;
    liquiditySource: string | SignedOrder[];
}

export interface ZeroExInstantProviderOptionalProps {
    provider: Provider;
    defaultAssetBuyAmount: number;
    additionalAssetMetaDataMap: ObjectMap<AssetMetaData>;
    networkId: Network;
    affiliateInfo: AffiliateInfo;
}

export class ZeroExInstantProvider extends React.Component<ZeroExInstantProviderProps> {
    private readonly _store: Store;
    private static _mergeInitialStateWithProps(props: ZeroExInstantProviderProps, state: State = INITIAL_STATE): State {
        const networkId = props.networkId || state.network;
        // TODO: Proper wallet connect flow
        const provider = props.provider || getInjectedProvider();
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
            affiliateInfo: props.affiliateInfo,
        };
        return storeStateFromProps;
    }
    constructor(props: ZeroExInstantProviderProps) {
        super(props);
        const initialAppState = ZeroExInstantProvider._mergeInitialStateWithProps(this.props, INITIAL_STATE);
        this._store = store.create(initialAppState);
    }

    public componentDidMount(): void {
        // tslint:disable-next-line:no-floating-promises
        asyncData.fetchAndDispatchToStore(this._store);

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
        const network = this._store.getState().network;
        const assetBuyerIfExists = this._store.getState().assetBuyer;
        const providerIfExists = oc(assetBuyerIfExists).provider();
        if (!_.isUndefined(providerIfExists)) {
            const web3Wrapper = new Web3Wrapper(providerIfExists);
            const networkOfProvider = await web3Wrapper.getNetworkIdAsync();
            if (network !== networkOfProvider) {
                const errorMessage = `Wrong network detected. Try switching to ${Network[network]}.`;
                errorFlasher.flashNewErrorMessage(this._store.dispatch, errorMessage, msToShowError);
            }
        }
    };
}
