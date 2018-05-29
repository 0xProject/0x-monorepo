import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { ActionTypes, ProviderType } from 'ts/types';

import { PortalOnboardingFlow as PortalOnboardingFlowComponent } from 'ts/components/onboarding/portal_onboarding_flow';
import { State } from 'ts/redux/reducer';

interface PortalOnboardingFlowProps {}

interface ConnectedState {
    stepIndex: number;
    isRunning: boolean;
    userAddress: string;
    providerType: ProviderType;
    injectedProviderName: string;
    blockchainIsLoaded: boolean;
    hasBeenSeen: boolean;
}

interface ConnectedDispatch {
    setIsRunning: (isRunning: boolean) => void;
    setOnboardingStep: (stepIndex: number) => void;
}

const mapStateToProps = (state: State): ConnectedState => ({
    stepIndex: state.portalOnboardingStep,
    isRunning: state.isPortalOnboardingShowing,
    userAddress: state.userAddress,
    providerType: state.providerType,
    injectedProviderName: state.injectedProviderName,
    blockchainIsLoaded: state.blockchainIsLoaded,
    hasBeenSeen: state.hasPortalOnboardingBeenSeen,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    setIsRunning: (isRunning: boolean): void => {
        dispatch({
            type: ActionTypes.UpdatePortalOnboardingShowing,
            data: isRunning,
        });
    },
    setOnboardingStep: (stepIndex: number): void => {
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
