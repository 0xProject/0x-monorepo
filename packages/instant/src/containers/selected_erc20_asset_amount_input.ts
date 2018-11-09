import { AssetBuyer } from '@0x/asset-buyer';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { ERC20AssetAmountInput } from '../components/erc20_asset_amount_input';
import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { ColorOption } from '../style/theme';
import { AffiliateInfo, ERC20Asset, OrderProcessState } from '../types';
import { buyQuoteUpdater } from '../util/buy_quote_updater';

export interface SelectedERC20AssetAmountInputProps {
    fontColor?: ColorOption;
    startingFontSizePx: number;
    onSelectAssetClick?: (asset?: ERC20Asset) => void;
}

interface ConnectedState {
    assetBuyer: AssetBuyer;
    value?: BigNumber;
    asset?: ERC20Asset;
    isDisabled: boolean;
    numberOfAssetsAvailable?: number;
    affiliateInfo?: AffiliateInfo;
}

interface ConnectedDispatch {
    updateBuyQuote: (
        assetBuyer: AssetBuyer,
        value?: BigNumber,
        asset?: ERC20Asset,
        affiliateInfo?: AffiliateInfo,
    ) => void;
}

interface ConnectedProps {
    value?: BigNumber;
    asset?: ERC20Asset;
    onChange: (value?: BigNumber, asset?: ERC20Asset) => void;
    isDisabled: boolean;
    numberOfAssetsAvailable?: number;
}

type FinalProps = ConnectedProps & SelectedERC20AssetAmountInputProps;

const mapStateToProps = (state: State, _ownProps: SelectedERC20AssetAmountInputProps): ConnectedState => {
    const processState = state.buyOrderState.processState;
    const isEnabled = processState === OrderProcessState.None || processState === OrderProcessState.Failure;
    const isDisabled = !isEnabled;
    const selectedAsset =
        !_.isUndefined(state.selectedAsset) && state.selectedAsset.metaData.assetProxyId === AssetProxyId.ERC20
            ? (state.selectedAsset as ERC20Asset)
            : undefined;
    const numberOfAssetsAvailable = _.isUndefined(state.availableAssets) ? undefined : state.availableAssets.length;
    const assetBuyer = state.providerState.assetBuyer;
    return {
        assetBuyer,
        value: state.selectedAssetAmount,
        asset: selectedAsset,
        isDisabled,
        numberOfAssetsAvailable,
        affiliateInfo: state.affiliateInfo,
    };
};

const debouncedUpdateBuyQuoteAsync = _.debounce(buyQuoteUpdater.updateBuyQuoteAsync.bind(buyQuoteUpdater), 200, {
    trailing: true,
});

const mapDispatchToProps = (
    dispatch: Dispatch<Action>,
    _ownProps: SelectedERC20AssetAmountInputProps,
): ConnectedDispatch => ({
    updateBuyQuote: (assetBuyer, value, asset, affiliateInfo) => {
        // Update the input
        dispatch(actions.updateSelectedAssetAmount(value));
        // invalidate the last buy quote.
        dispatch(actions.updateLatestBuyQuote(undefined));
        // reset our buy state
        dispatch(actions.setBuyOrderStateNone());

        if (!_.isUndefined(value) && value.greaterThan(0) && !_.isUndefined(asset)) {
            // even if it's debounced, give them the illusion it's loading
            dispatch(actions.setQuoteRequestStatePending());
            // tslint:disable-next-line:no-floating-promises
            debouncedUpdateBuyQuoteAsync(assetBuyer, dispatch, asset, value, affiliateInfo);
        }
    },
});

const mergeProps = (
    connectedState: ConnectedState,
    connectedDispatch: ConnectedDispatch,
    ownProps: SelectedERC20AssetAmountInputProps,
): FinalProps => {
    return {
        ...ownProps,
        asset: connectedState.asset,
        value: connectedState.value,
        onChange: (value, asset) => {
            connectedDispatch.updateBuyQuote(connectedState.assetBuyer, value, asset, connectedState.affiliateInfo);
        },
        isDisabled: connectedState.isDisabled,
        numberOfAssetsAvailable: connectedState.numberOfAssetsAvailable,
    };
};

export const SelectedERC20AssetAmountInput: React.ComponentClass<SelectedERC20AssetAmountInputProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
)(ERC20AssetAmountInput);
