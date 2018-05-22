import * as _ from 'lodash';
import * as React from 'react';
import Joyride, { Step, StyleOptions } from 'react-joyride';

import { zIndex } from 'ts/utils/style';

interface OnboardingFlowProps {
    steps: Step[];
    stepIndex?: number;
    isRunning: boolean;
}

const style: StyleOptions = {
    zIndex: zIndex.overlay,
};

// Wrapper around Joyride with defaults and styles set
export class OnboardingFlow extends React.Component<OnboardingFlowProps> {
    public render(): React.ReactNode {
        const { steps, stepIndex, isRunning } = this.props;
        return (
            <Joyride
                run={isRunning}
                debug={true}
                steps={steps}
                stepIndex={stepIndex}
                styles={{ options: style }}
            />
        );
    }
};
