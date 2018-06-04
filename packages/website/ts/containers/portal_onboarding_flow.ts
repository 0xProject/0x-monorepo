import { BigNumber } from '@0xproject/utils';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { ActionTypes, ProviderType, TokenByAddress, TokenStateByAddress } from 'ts/types';

import { PortalOnboardingFlow as PortalOnboardingFlowComponent } from 'ts/components/onboarding/portal_onboarding_flow';
import { State } from 'ts/redux/reducer';

interface PortalOnboardingFlowProps {
    trackedTokenStateByAddress: TokenStateByAddress;
}

interface ConnectedState {
    stepIndex: number;
    isRunning: boolean;
    userAddress: string;
    hasBeenSeen: boolean;
    providerType: ProviderType;
    injectedProviderName: string;
    blockchainIsLoaded: boolean;
    userEtherBalanceInWei?: BigNumber;
    tokenByAddress: TokenByAddress;
}

interface ConnectedDispatch {
    updateIsRunning: (isRunning: boolean) => void;
    updateOnboardingStep: (stepIndex: number) => void;
}

const mapStateToProps = (state: State, ownProps: PortalOnboardingFlowProps): ConnectedState => ({
    stepIndex: state.portalOnboardingStep,
    isRunning: state.isPortalOnboardingShowing,
    userAddress: state.userAddress,
    providerType: state.providerType,
    injectedProviderName: state.injectedProviderName,
    blockchainIsLoaded: state.blockchainIsLoaded,
    userEtherBalanceInWei: state.userEtherBalanceInWei,
    tokenByAddress: state.tokenByAddress,
    hasBeenSeen: state.hasPortalOnboardingBeenSeen,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    updateIsRunning: (isRunning: boolean): void => {
        dispatch({
            type: ActionTypes.UpdatePortalOnboardingShowing,
            data: isRunning,
        });
    },
    updateOnboardingStep: (stepIndex: number): void => {
        dispatch({
            type: ActionTypes.UpdatePortalOnboardingStep,
            data: stepIndex,
        });
    },
});

export const PortalOnboardingFlow: React.ComponentClass<PortalOnboardingFlowProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(PortalOnboardingFlowComponent);
