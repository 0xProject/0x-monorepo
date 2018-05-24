import * as React from 'react';
import { Step } from 'react-joyride';

import { OnboardingFlow } from 'ts/components/onboarding/onboarding_flow';

export interface PortalOnboardingFlowProps {
    stepIndex: number;
    isRunning: boolean;
    onClose: () => void;
}

const steps: Step[] = [
    {
        target: '.wallet',
        content: 'You are onboarding right now!',
        placement: 'right',
        disableBeacon: true,
    },
];

export class PortalOnboardingFlow extends React.Component<PortalOnboardingFlowProps> {
    public render(): React.ReactNode {
        return (
            <OnboardingFlow
                steps={steps}
                stepIndex={this.props.stepIndex}
                isRunning={this.props.isRunning}
                onClose={this.props.onClose}
            />
        );
    }
}
