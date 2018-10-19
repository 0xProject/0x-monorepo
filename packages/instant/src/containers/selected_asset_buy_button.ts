import { BuyQuote } from '@0x/asset-buyer';
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
    text: textForState(state.buyOrderState),
    buyQuote: state.latestBuyQuote,
});

const mapDispatchToProps = (dispatch: Dispatch<Action>, ownProps: SelectedAssetBuyButtonProps): ConnectedDispatch => ({
    onClick: buyQuote => dispatch(actions.updatebuyOrderState(AsyncProcessState.PENDING)),
    onBuySuccess: buyQuote => dispatch(actions.updatebuyOrderState(AsyncProcessState.SUCCESS)),
    onBuyFailure: buyQuote => dispatch(actions.updatebuyOrderState(AsyncProcessState.FAILURE)),
});

export const SelectedAssetBuyButton: React.ComponentClass<SelectedAssetBuyButtonProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(BuyButton);
