import { AssetBuyer, BuyQuote } from '@0x/asset-buyer';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { AsyncProcessState } from '../types';

import { BuyButton } from '../components/buy_button';

export interface SelectedAssetBuyButtonProps {}

interface ConnectedState {
    assetBuyer?: AssetBuyer;
    buyQuote?: BuyQuote;
}

interface ConnectedDispatch {
    onBuyClick: (buyQuote: BuyQuote) => void;
    onBuySuccess: (buyQuote: BuyQuote) => void;
    onBuyFailure: (buyQuote: BuyQuote) => void;
}

const mapStateToProps = (state: State, _ownProps: SelectedAssetBuyButtonProps): ConnectedState => ({
    assetBuyer: state.assetBuyer,
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
)(BuyButton);
