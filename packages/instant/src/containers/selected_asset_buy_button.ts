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
    onClick: (buyQuote: BuyQuote) => void;
    onBuySuccess: (buyQuote: BuyQuote, txnHash: string) => void;
    onBuyFailure: (buyQuote: BuyQuote) => void;
    onBuyPrevented: (buyQuote: BuyQuote, error: Error) => void;
}

const mapStateToProps = (state: State, _ownProps: SelectedAssetBuyButtonProps): ConnectedState => ({
    assetBuyer: state.assetBuyer,
    buyQuote: state.latestBuyQuote,
});

const mapDispatchToProps = (dispatch: Dispatch<Action>, ownProps: SelectedAssetBuyButtonProps): ConnectedDispatch => ({
    onClick: buyQuote => dispatch(actions.updateBuyOrderState({ processState: AsyncProcessState.PENDING })),
    onBuySuccess: (buyQuote: BuyQuote, txnHash: string) =>
        dispatch(actions.updateBuyOrderState({ processState: AsyncProcessState.SUCCESS, txnHash })),
    onBuyFailure: buyQuote => dispatch(actions.updateBuyOrderState({ processState: AsyncProcessState.FAILURE })),
    onBuyPrevented: (buyQuote, error) => {
        dispatch(actions.resetAmount());
        dispatch(actions.setError(error));
    },
});

export const SelectedAssetBuyButton: React.ComponentClass<SelectedAssetBuyButtonProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(BuyButton);
