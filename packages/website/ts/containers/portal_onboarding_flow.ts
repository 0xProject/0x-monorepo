import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { ActionTypes } from 'ts/types';

import { PortalOnboardingFlow as PortalOnboardingFlowComponent } from 'ts/components/onboarding/portal_onboarding_flow';
import { State } from 'ts/redux/reducer';

interface PortalOnboardingFlowProps {}

interface ConnectedState {
    stepIndex: number;
    isRunning: boolean;
}

interface ConnectedDispatch {
    setOnboardingShowing: (isShowing: boolean) => void;
}

const mapStateToProps = (state: State): ConnectedState => ({
    stepIndex: state.portalOnboardingStep,
    isRunning: state.isPortalOnboardingShowing,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    setOnboardingShowing: (isShowing: boolean): void => {
        dispatch({
            type: ActionTypes.UpdatePortalOnboardingShowing,
            data: isShowing,
        });
    },
});

export const PortalOnboardingFlow: React.ComponentClass<PortalOnboardingFlowProps> = connect(mapStateToProps, mapDispatchToProps)(PortalOnboardingFlowComponent);
