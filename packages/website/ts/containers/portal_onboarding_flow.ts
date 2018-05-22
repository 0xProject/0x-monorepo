import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import {
    PortalOnboardingFlow as PortalOnboardingFlowComponent,
    PortalOnboardingFlowProps as PortalOnboardingFlowComponentProps,
} from 'ts/components/onboarding/portal_onboarding_flow';
import { State } from 'ts/redux/reducer';

interface ConnectedState {
    stepIndex: number;
    isRunning: boolean;
}

const mapStateToProps = (state: State, ownProps: PortalOnboardingFlowComponentProps): ConnectedState => {
    return {
        stepIndex: state.portalOnboardingStep,
        isRunning: state.isPortalOnboardingShowing,
    };
};

export const PortalOnboardingFlow: React.ComponentClass<PortalOnboardingFlowComponentProps> = connect(mapStateToProps)(PortalOnboardingFlowComponent);
