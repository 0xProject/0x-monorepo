import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { PaymentMethod, PaymentMethodProps } from '../components/payment_method';
import {
    COINBASE_WALLET_ANDROID_APP_STORE_URL,
    COINBASE_WALLET_IOS_APP_STORE_URL,
    COINBASE_WALLET_SITE_URL,
} from '../constants';
import { Action, actions } from '../redux/actions';
import { asyncData } from '../redux/async_data';
import { State } from '../redux/reducer';
import { Network, Omit, OperatingSystem, ProviderState, StandardSlidingPanelContent, WalletSuggestion } from '../types';
import { analytics } from '../util/analytics';
import { envUtil } from '../util/env';

export interface ConnectedAccountPaymentMethodProps {}

interface ConnectedState {
    network: Network;
    providerState: ProviderState;
    walletDisplayName?: string;
}

interface ConnectedDispatch {
    openInstallWalletPanel: () => void;
    unlockWalletAndDispatchToStore: (providerState: ProviderState) => void;
}

type ConnectedProps = Omit<PaymentMethodProps, keyof ConnectedAccountPaymentMethodProps>;

type FinalProps = ConnectedProps & ConnectedAccountPaymentMethodProps;

const mapStateToProps = (state: State, _ownProps: ConnectedAccountPaymentMethodProps): ConnectedState => ({
    network: state.network,
    providerState: state.providerState,
    walletDisplayName: state.walletDisplayName,
});

const mapDispatchToProps = (
    dispatch: Dispatch<Action>,
    ownProps: ConnectedAccountPaymentMethodProps,
): ConnectedDispatch => ({
    openInstallWalletPanel: () => dispatch(actions.openStandardSlidingPanel(StandardSlidingPanelContent.InstallWallet)),
    unlockWalletAndDispatchToStore: (providerState: ProviderState) => {
        analytics.trackAccountUnlockRequested();
        // tslint:disable-next-line:no-floating-promises
        asyncData.fetchAccountInfoAndDispatchToStore2(providerState, dispatch, true);
    },
});

const mergeProps = (
    connectedState: ConnectedState,
    connectedDispatch: ConnectedDispatch,
    ownProps: ConnectedAccountPaymentMethodProps,
): FinalProps => ({
    ...ownProps,
    network: connectedState.network,
    account: connectedState.providerState.account,
    walletDisplayName: connectedState.providerState.displayName,
    onUnlockWalletClick: () => connectedDispatch.unlockWalletAndDispatchToStore(connectedState.providerState),
    onInstallWalletClick: () => {
        const isMobile = envUtil.isMobileOperatingSystem();
        const walletSuggestion: WalletSuggestion = isMobile
            ? WalletSuggestion.CoinbaseWallet
            : WalletSuggestion.MetaMask;

        analytics.trackInstallWalletClicked(walletSuggestion);
        if (walletSuggestion === WalletSuggestion.MetaMask) {
            connectedDispatch.openInstallWalletPanel();
        } else {
            const operatingSystem = envUtil.getOperatingSystem();
            let url = COINBASE_WALLET_SITE_URL;
            switch (operatingSystem) {
                case OperatingSystem.Android:
                    url = COINBASE_WALLET_ANDROID_APP_STORE_URL;
                    break;
                case OperatingSystem.iOS:
                    url = COINBASE_WALLET_IOS_APP_STORE_URL;
                    break;
                default:
                    break;
            }
            window.open(url, '_blank');
        }
    },
});

export const ConnectedAccountPaymentMethod: React.ComponentClass<ConnectedAccountPaymentMethodProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
)(PaymentMethod);
