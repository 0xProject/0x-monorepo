import { AssetBuyer, BigNumber } from '@0x/asset-buyer';
import { ObjectMap, SignedOrder } from '@0x/types';
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

        const workingOrder: SignedOrder = {
            senderAddress: '0x0000000000000000000000000000000000000000',
            makerAddress: '0x14e2f1f157e7dd4057d02817436d628a37120fd1',
            takerAddress: '0x0000000000000000000000000000000000000000',
            makerFee: new BigNumber('0'),
            takerFee: new BigNumber('0'),
            makerAssetAmount: new BigNumber('100000000000000000000'),
            takerAssetAmount: new BigNumber('10000000000000000'),
            makerAssetData: '0xf47261b00000000000000000000000002002d3812f58e35f0ea1ffbf80a75a38c32175fa',
            takerAssetData: '0xf47261b0000000000000000000000000d0a1e359811322d97991e03f863a0c30c2cf029c',
            expirationTimeSeconds: new BigNumber('1591858800'),
            feeRecipientAddress: '0x0000000000000000000000000000000000000000',
            salt: new BigNumber('54983920541892966634674340965984367456810207583416050222519063020710969340046'),
            signature:
                '0x1b949656218421c845995457303569a656764afa2b979d41dcefff0009d57ce15001490268bc7caa4269894fd83b741465fc5a7a53eda6ece17eb91fb32655d83703',
            exchangeAddress: '0x35dd2932454449b14cee11a94d3674a936d5d7b2',
        };

        const badOrder: SignedOrder = {
            senderAddress: '0x0000000000000000000000000000000000000000',
            makerAddress: '0x50ff5828a216170cf224389f1c5b0301a5d0a230',
            takerAddress: '0x0000000000000000000000000000000000000000',
            makerFee: new BigNumber('0'),
            takerFee: new BigNumber('0'),
            makerAssetAmount: new BigNumber('100000000000000000000'),
            takerAssetAmount: new BigNumber('10000000000000000'),
            makerAssetData: '0xf47261b00000000000000000000000002002d3812f58e35f0ea1ffbf80a75a38c32175fa',
            takerAssetData: '0xf47261b0000000000000000000000000d0a1e359811322d97991e03f863a0c30c2cf029c',
            expirationTimeSeconds: new BigNumber('1587625200'),
            feeRecipientAddress: '0x0000000000000000000000000000000000000000',
            salt: new BigNumber('90333693019052475792952208249358345327080247071239178156836460754978063223629'),
            signature:
                '0x1bd8a8dbaf6926af217b1ae055377287b70e8b6b3d274df8e05b3220b7ac67bdfb7efd874d38f12d85c2c7d93ee9e3a0544081f9626384fc15af9eb903f627504403',
            exchangeAddress: '0x35dd2932454449b14cee11a94d3674a936d5d7b2',
        };

        const assetBuyer = AssetBuyer.getAssetBuyerForProvidedOrders(getProvider(), [badOrder], [], {
            networkId: 42,
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
