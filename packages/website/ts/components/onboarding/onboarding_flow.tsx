import * as _ from 'lodash';
import * as React from 'react';
import Joyride, { Step, StyleOptions } from 'react-joyride';

import { zIndex } from 'ts/utils/style';

interface OnboardingFlowProps {
    steps: Step[];
    stepIndex: number;
    isRunning: boolean;
    onClose: () => void;
    onChange?: (options: any) => void;
}

const style: StyleOptions = {
    zIndex: zIndex.overlay,
};

// Wrapper around Joyride with defaults and styles set
export class OnboardingFlow extends React.Component<OnboardingFlowProps> {
    public static defaultProps: Partial<OnboardingFlowProps> = {
        onChange: _.noop,
    };

    public render(): React.ReactNode {
        return (
            <Joyride
                run={this.props.isRunning}
                debug={true}
                steps={this.props.steps}
                stepIndex={this.props.stepIndex}
                styles={{ options: style }}
                callback={this._handleChange.bind(this)}
            />
        );
    }

    private _handleChange(options: any): void {
        switch (options.action) {
            case 'close':
                this.props.onClose();
        }
        this.props.onChange(options);
    }
}
