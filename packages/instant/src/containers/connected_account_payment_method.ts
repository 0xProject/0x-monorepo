import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { PaymentMethod } from '../components/payment_method';
import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { Account, Network, StandardSlidingPanelContent } from '../types';

export interface ConnectedAccountPaymentMethodProps {}

interface ConnectedState {
    account: Account;
    network: Network;
}

interface ConnectedDispatch {
    openStandardSlidingPanel: (content: StandardSlidingPanelContent) => void;
}

const mapStateToProps = (state: State, _ownProps: ConnectedAccountPaymentMethodProps): ConnectedState => ({
    account: state.providerState.account,
    network: state.network,
});

const mapDispatchToProps = (
    dispatch: Dispatch<Action>,
    ownProps: ConnectedAccountPaymentMethodProps,
): ConnectedDispatch => ({
    openStandardSlidingPanel: (content: StandardSlidingPanelContent) =>
        dispatch(actions.openStandardSlidingPanel(content)),
});

export const ConnectedAccountPaymentMethod: React.ComponentClass<ConnectedAccountPaymentMethodProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(PaymentMethod);
