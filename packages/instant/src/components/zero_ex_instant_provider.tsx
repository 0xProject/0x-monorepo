import { AssetBuyer } from '@0x/asset-buyer';
import { ObjectMap, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
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
import { errorFlasher } from '../util/error_flasher';
import { gasPriceEstimator } from '../util/gas_price_estimator';
import { getInjectedProvider } from '../util/injected_provider';

fonts.include();

export type ZeroExInstantProviderProps = ZeroExInstantProviderRequiredProps &
    Partial<ZeroExInstantProviderOptionalProps>;

export interface ZeroExInstantProviderRequiredProps {
    orderSource: string | SignedOrder[];
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
    private static _mergeInitialStateWithProps(props: ZeroExInstantProviderProps, state: State = INITIAL_STATE): State {
        const networkId = props.networkId || state.network;
        // TODO: Proper wallet connect flow
        const provider = props.provider || getInjectedProvider();
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
        const initialAppState = ZeroExInstantProvider._mergeInitialStateWithProps(this.props, INITIAL_STATE);
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
