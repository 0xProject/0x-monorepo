import { AssetBuyer, BuyQuote } from '@0x/asset-buyer';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { ColorOption } from '../style/theme';
import { AsyncProcessState, ERC20Asset } from '../types';
import { errorUtil } from '../util/error';

import { AssetAmountInput } from '../components/asset_amount_input';

export interface SelectedAssetAmountInputProps {
    fontColor?: ColorOption;
    startingFontSizePx: number;
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
    if (_.isUndefined(selectedAsset) || selectedAsset.metaData.assetProxyId !== AssetProxyId.ERC20) {
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
    assetBuyer: AssetBuyer,
    dispatch: Dispatch<Action>,
    asset: ERC20Asset,
    assetAmount: BigNumber,
): Promise<void> => {
    // get a new buy quote.
    const baseUnitValue = Web3Wrapper.toBaseUnitAmount(assetAmount, asset.metaData.decimals);

    // mark quote as pending
    dispatch(actions.setQuoteRequestStatePending());

    let newBuyQuote: BuyQuote | undefined;
    try {
        newBuyQuote = await assetBuyer.getBuyQuoteAsync(asset.assetData, baseUnitValue);
    } catch (error) {
        dispatch(actions.setQuoteRequestStateFailure());
        errorUtil.errorFlasher.flashNewError(dispatch, error);
        return;
    }
    // We have a successful new buy quote
    errorUtil.errorFlasher.clearError(dispatch);
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
        dispatch(actions.updateBuyOrderState({ processState: AsyncProcessState.NONE }));

        if (!_.isUndefined(value) && !_.isUndefined(asset) && !_.isUndefined(assetBuyer)) {
            // even if it's debounced, give them the illusion it's loading
            dispatch(actions.setQuoteRequestStatePending());
            // tslint:disable-next-line:no-floating-promises
            debouncedUpdateBuyQuoteAsync(assetBuyer, dispatch, asset, value);
        }
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
