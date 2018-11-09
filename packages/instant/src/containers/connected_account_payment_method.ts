import * as React from 'react';
import { connect } from 'react-redux';

import { State } from '../redux/reducer';
import { Account } from '../types';

import { PaymentMethod } from '../components/payment_method';

export interface ConnectedAccountPaymentMethodProps {}

interface ConnectedState {
    account: Account;
}

const mapStateToProps = (state: State, _ownProps: ConnectedAccountPaymentMethodProps): ConnectedState => ({
    account: state.providerState.account,
});

export const ConnectedAccountPaymentMethod: React.ComponentClass<ConnectedAccountPaymentMethodProps> = connect(
    mapStateToProps,
)(PaymentMethod);
