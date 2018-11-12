import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { PaymentMethod } from '../components/payment_method';
import { Action, actions } from '../redux/actions';
import { asyncData } from '../redux/async_data';
import { State } from '../redux/reducer';
import { Account, Network, ProviderState, StandardSlidingPanelContent } from '../types';

export interface ConnectedAccountPaymentMethodProps {}

interface ConnectedState {
    network: Network;
    providerState: ProviderState;
}

interface ConnectedDispatch {
    onInstallWalletClick: () => void;
    unlockWalletAndDispatchToStore: (providerState: ProviderState) => void;
}

interface ConnectedProps {
    onInstallWalletClick: () => void;
    onUnlockWalletClick: () => void;
    account: Account;
    network: Network;
}

type FinalProps = ConnectedProps & ConnectedAccountPaymentMethodProps;

const mapStateToProps = (state: State, _ownProps: ConnectedAccountPaymentMethodProps): ConnectedState => ({
    network: state.network,
    providerState: state.providerState,
});

const mapDispatchToProps = (
    dispatch: Dispatch<Action>,
    ownProps: ConnectedAccountPaymentMethodProps,
): ConnectedDispatch => ({
    onInstallWalletClick: () => dispatch(actions.openStandardSlidingPanel(StandardSlidingPanelContent.InstallWallet)),
    unlockWalletAndDispatchToStore: async (providerState: ProviderState) =>
        asyncData.fetchAccountInfoAndDispatchToStore(providerState, dispatch, true),
});

const mergeProps = (
    connectedState: ConnectedState,
    connectedDispatch: ConnectedDispatch,
    ownProps: ConnectedAccountPaymentMethodProps,
): FinalProps => ({
    ...ownProps,
    network: connectedState.network,
    account: connectedState.providerState.account,
    onInstallWalletClick: connectedDispatch.onInstallWalletClick,
    onUnlockWalletClick: () => {
        connectedDispatch.unlockWalletAndDispatchToStore(connectedState.providerState);
    },
});

export const ConnectedAccountPaymentMethod: React.ComponentClass<ConnectedAccountPaymentMethodProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
)(PaymentMethod);
