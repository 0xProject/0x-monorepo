import * as React from 'react';
import { connect } from 'react-redux';

import { State } from '../redux/reducer';
import { Account, Network } from '../types';

import { PaymentMethod } from '../components/payment_method';

export interface ConnectedAccountPaymentMethodProps {}

interface ConnectedState {
    account: Account;
    network: Network;
}

const mapStateToProps = (state: State, _ownProps: ConnectedAccountPaymentMethodProps): ConnectedState => ({
    account: state.providerState.account,
    network: state.network,
});

export const ConnectedAccountPaymentMethod: React.ComponentClass<ConnectedAccountPaymentMethodProps> = connect(
    mapStateToProps,
)(PaymentMethod);
