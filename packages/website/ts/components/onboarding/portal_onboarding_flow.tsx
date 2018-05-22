import * as React from 'react';

import { OnboardingFlow } from 'ts/components/onboarding/onboarding_flow';

export interface PortalOnboardingFlowProps {
    stepIndex: number;
    isRunning: boolean;
}

const steps = [
    {
        target: '.wallet',
        content: 'Hey!',
        placement: 'right',
        disableBeacon: true,
    },
];

export class PortalOnboardingFlow extends React.Component<PortalOnboardingFlow> {
    public render(): React.ReactNode {
        return (
            <OnboardingFlow
                steps={steps}
                stepIndex={this.props.stepIndex}
                isRunning={this.props.isRunning}
            />
        )
    }
};
