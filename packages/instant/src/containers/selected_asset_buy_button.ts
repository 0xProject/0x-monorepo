import { BuyQuote } from '@0xproject/asset-buyer';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { State } from '../redux/reducer';
import { Action, ActionTypes, AsyncProcessState } from '../types';
import { assetBuyer } from '../util/asset_buyer';
import { web3Wrapper } from '../util/web3_wrapper';

import { BuyButton, BuyButtonProps } from '../components/buy_button';

export interface SelectedAssetBuyButtonProps {}

interface ConnectedState {
    text: string;
    buyQuote?: BuyQuote;
}

interface ConnectedDispatch {
    onClick: (buyQuote: BuyQuote) => void;
    onBuySuccess: (buyQuote: BuyQuote) => void;
    onBuyFailure: (buyQuote: BuyQuote) => void;
}

const textForState = (state: AsyncProcessState): string => {
    switch (state) {
        case AsyncProcessState.NONE:
            return 'Buy';
        case AsyncProcessState.PENDING:
            return '...Loading';
        case AsyncProcessState.SUCCESS:
            return 'Success!';
        case AsyncProcessState.FAILURE:
            return 'Failed';
        default:
            return 'Buy';
    }
};

const mapStateToProps = (state: State, _ownProps: SelectedAssetBuyButtonProps): ConnectedState => ({
    text: textForState(state.selectedAssetBuyState),
    buyQuote: state.latestBuyQuote,
});

const mapDispatchToProps = (dispatch: Dispatch<Action>, ownProps: SelectedAssetBuyButtonProps): ConnectedDispatch => ({
    onClick: buyQuote =>
        dispatch({ type: ActionTypes.UPDATE_SELECTED_ASSET_BUY_STATE, data: AsyncProcessState.PENDING }),
    onBuySuccess: buyQuote =>
        dispatch({ type: ActionTypes.UPDATE_SELECTED_ASSET_BUY_STATE, data: AsyncProcessState.SUCCESS }),
    onBuyFailure: buyQuote =>
        dispatch({ type: ActionTypes.UPDATE_SELECTED_ASSET_BUY_STATE, data: AsyncProcessState.FAILURE }),
});

export const SelectedAssetBuyButton: React.ComponentClass<SelectedAssetBuyButtonProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(BuyButton);
