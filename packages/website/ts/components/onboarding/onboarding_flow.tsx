import * as _ from 'lodash';
import * as React from 'react';
import Joyride, { CallbackData, Step, StyleOptions } from 'react-joyride';

import { zIndex } from 'ts/utils/style';

export interface OnboardingFlowProps {
    steps: Step[];
    stepIndex: number;
    isRunning: boolean;
    onClose: () => void;
}

const joyrideStyleOptions: StyleOptions = {
    zIndex: zIndex.overlay,
};

// Wrapper around Joyride with defaults and styles set
export class OnboardingFlow extends React.Component<OnboardingFlowProps> {
    public render(): React.ReactNode {
        return (
            <Joyride
                run={this.props.isRunning}
                debug={true}
                steps={this.props.steps}
                stepIndex={this.props.stepIndex}
                styles={{ options: joyrideStyleOptions }}
                callback={this._handleChange.bind(this)}
            />
        );
    }

    private _handleChange(data: CallbackData): void {
        switch (data.action) {
            case 'close':
                this.props.onClose();
        }
    }
}
