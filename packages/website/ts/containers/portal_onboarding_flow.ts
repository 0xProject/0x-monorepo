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
    onClose: () => void;
}

const mapStateToProps = (state: State): ConnectedState => ({
    stepIndex: state.portalOnboardingStep,
    isRunning: state.isPortalOnboardingShowing,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    onClose: (): void => {
        dispatch({
            type: ActionTypes.UpdatePortalOnboardingShowing,
            data: false,
        });
    },
});

export const PortalOnboardingFlow: React.ComponentClass<PortalOnboardingFlowProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(PortalOnboardingFlowComponent);
