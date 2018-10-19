// TODO: Rename to SelectedAssetButton
import { AssetBuyer, BuyQuote } from '@0x/asset-buyer';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { AsyncProcessState } from '../types';

import { AssetButton } from '../components/asset_button';

// TODO: rename
export interface SelectedAssetBuyButtonProps {}

interface ConnectedState {
    assetBuyer?: AssetBuyer;
    buyOrderState: AsyncProcessState;
    buyQuote?: BuyQuote;
}

interface ConnectedDispatch {
    onBuyClick: (buyQuote: BuyQuote) => void;
    onBuySuccess: (buyQuote: BuyQuote) => void;
    onBuyFailure: (buyQuote: BuyQuote) => void;
}

const mapStateToProps = (state: State, _ownProps: SelectedAssetBuyButtonProps): ConnectedState => ({
    assetBuyer: state.assetBuyer,
    buyOrderState: state.buyOrderState,
    buyQuote: state.latestBuyQuote,
});

const mapDispatchToProps = (dispatch: Dispatch<Action>, ownProps: SelectedAssetBuyButtonProps): ConnectedDispatch => ({
    onBuyClick: buyQuote => dispatch(actions.updatebuyOrderState(AsyncProcessState.PENDING)),
    onBuySuccess: buyQuote => dispatch(actions.updatebuyOrderState(AsyncProcessState.SUCCESS)),
    onBuyFailure: buyQuote => dispatch(actions.updatebuyOrderState(AsyncProcessState.FAILURE)),
});

export const SelectedAssetBuyButton: React.ComponentClass<SelectedAssetBuyButtonProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(AssetButton);
