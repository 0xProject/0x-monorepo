import { AssetBuyer, BuyQuote } from '@0x/asset-buyer';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { OrderProcessState, OrderState } from '../types';

import { BuyButton } from '../components/buy_button';

export interface SelectedAssetBuyButtonProps {}

interface ConnectedState {
    assetBuyer?: AssetBuyer;
    buyQuote?: BuyQuote;
}

interface ConnectedDispatch {
    onAwaitingSignature: (buyQuote: BuyQuote) => void;
    onSignatureDenied: (buyQuote: BuyQuote, error: Error) => void;
    onBuyProcessing: (buyQuote: BuyQuote, txHash: string) => void;
    onBuySuccess: (buyQuote: BuyQuote, txHash: string) => void;
    onBuyFailure: (buyQuote: BuyQuote, txHash: string) => void;
}

const mapStateToProps = (state: State, _ownProps: SelectedAssetBuyButtonProps): ConnectedState => ({
    assetBuyer: state.assetBuyer,
    buyQuote: state.latestBuyQuote,
});

const mapDispatchToProps = (dispatch: Dispatch<Action>, ownProps: SelectedAssetBuyButtonProps): ConnectedDispatch => ({
    onAwaitingSignature: (buyQuote: BuyQuote) => {
        const newOrderState: OrderState = { processState: OrderProcessState.AWAITING_SIGNATURE };
        dispatch(actions.updateBuyOrderState(newOrderState));
    },
    onBuyProcessing: (buyQuote: BuyQuote, txHash: string) => {
        const newOrderState: OrderState = { processState: OrderProcessState.PROCESSING, txHash };
        dispatch(actions.updateBuyOrderState(newOrderState));
    },
    onBuySuccess: (buyQuote: BuyQuote, txHash: string) =>
        dispatch(actions.updateBuyOrderState({ processState: OrderProcessState.SUCCESS, txHash })),
    onBuyFailure: (buyQuote: BuyQuote, txHash: string) =>
        dispatch(actions.updateBuyOrderState({ processState: OrderProcessState.FAILURE, txHash })),
    onSignatureDenied: (buyQuote, error) => {
        dispatch(actions.resetAmount());
        dispatch(actions.setError(error));
    },
});

export const SelectedAssetBuyButton: React.ComponentClass<SelectedAssetBuyButtonProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(BuyButton);
