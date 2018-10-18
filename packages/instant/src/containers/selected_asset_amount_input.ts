import { AssetBuyer } from '@0xproject/asset-buyer';
import { AssetProxyId } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { ColorOption } from '../style/theme';
import { AsyncProcessState, ERC20Asset } from '../types';

import { AssetAmountInput } from '../components/asset_amount_input';

export interface SelectedAssetAmountInputProps {
    fontColor?: ColorOption;
    fontSize?: string;
}

interface ConnectedState {
    assetBuyer?: AssetBuyer;
    value?: BigNumber;
    asset?: ERC20Asset;
}

interface ConnectedDispatch {
    updateBuyQuote: (assetBuyer?: AssetBuyer, value?: BigNumber, asset?: ERC20Asset) => void;
}

interface ConnectedProps {
    value?: BigNumber;
    asset?: ERC20Asset;
    onChange: (value?: BigNumber, asset?: ERC20Asset) => void;
}

type FinalProps = ConnectedProps & SelectedAssetAmountInputProps;

const mapStateToProps = (state: State, _ownProps: SelectedAssetAmountInputProps): ConnectedState => {
    const selectedAsset = state.selectedAsset;
    if (_.isUndefined(selectedAsset) || selectedAsset.assetProxyId !== AssetProxyId.ERC20) {
        return {
            value: state.selectedAssetAmount,
        };
    }
    return {
        assetBuyer: state.assetBuyer,
        value: state.selectedAssetAmount,
        asset: selectedAsset as ERC20Asset,
    };
};

const updateBuyQuoteAsync = async (
    dispatch: Dispatch<Action>,
    assetBuyer?: AssetBuyer,
    asset?: ERC20Asset,
    assetAmount?: BigNumber,
): Promise<void> => {
    if (
        _.isUndefined(assetBuyer) ||
        _.isUndefined(assetAmount) ||
        _.isUndefined(asset) ||
        _.isUndefined(asset.metaData)
    ) {
        return;
    }
    // get a new buy quote.
    const baseUnitValue = Web3Wrapper.toBaseUnitAmount(assetAmount, asset.metaData.decimals);
    const newBuyQuote = await assetBuyer.getBuyQuoteAsync(asset.assetData, baseUnitValue);
    // invalidate the last buy quote.
    dispatch(actions.updateLatestBuyQuote(newBuyQuote));
};

const debouncedUpdateBuyQuoteAsync = _.debounce(updateBuyQuoteAsync, 200, { trailing: true });

const mapDispatchToProps = (
    dispatch: Dispatch<Action>,
    _ownProps: SelectedAssetAmountInputProps,
): ConnectedDispatch => ({
    updateBuyQuote: (assetBuyer, value, asset) => {
        // Update the input
        dispatch(actions.updateSelectedAssetAmount(value));
        // invalidate the last buy quote.
        dispatch(actions.updateLatestBuyQuote(undefined));
        // reset our buy state
        dispatch(actions.updateSelectedAssetBuyState(AsyncProcessState.NONE));
        // tslint:disable-next-line:no-floating-promises
        debouncedUpdateBuyQuoteAsync(dispatch, assetBuyer, asset, value);
    },
});

const mergeProps = (
    connectedState: ConnectedState,
    connectedDispatch: ConnectedDispatch,
    ownProps: SelectedAssetAmountInputProps,
): FinalProps => {
    return {
        ...ownProps,
        asset: connectedState.asset,
        value: connectedState.value,
        onChange: (value, asset) => {
            connectedDispatch.updateBuyQuote(connectedState.assetBuyer, value, asset);
        },
    };
};

export const SelectedAssetAmountInput: React.ComponentClass<SelectedAssetAmountInputProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
)(AssetAmountInput);
