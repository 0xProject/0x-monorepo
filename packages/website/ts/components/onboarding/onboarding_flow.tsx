import * as _ from 'lodash';
import * as React from 'react';
import Joyride, { CallbackData, Step, StyleOptions } from 'react-joyride';

import { zIndex } from 'ts/utils/style';

export interface OnboardingFlowProps {
    steps: Step[];
    blacklistedStepIndices: number[];
    stepIndex: number;
    isRunning: boolean;
    onClose: () => void;
    setOnboardingStep: (stepIndex: number) => void;
}

const joyrideStyleOptions: StyleOptions = {
    zIndex: zIndex.overlay,
};

// Wrapper around Joyride with defaults and styles set
export class OnboardingFlow extends React.Component<OnboardingFlowProps> {
    public componentDidMount(): void {
        this._setOnboardingStepBasedOnBlacklist(this.props.stepIndex);
    }

    public componentWillReceiveProps(nextProps: OnboardingFlowProps): void {
        this._setOnboardingStepBasedOnBlacklist(nextProps.stepIndex);
    }

    public render(): React.ReactNode {
        return (
            <Joyride
                run={this.props.isRunning}
                continuous={true}
                debug={true}
                steps={this.props.steps}
                stepIndex={this.props.stepIndex}
                styles={{ options: joyrideStyleOptions }}
                callback={this._handleChange.bind(this)}
            />
        );
    }

    private _setOnboardingStepBasedOnBlacklist(nextIndex: number): void {
        const blacklistedSteps = this.props.blacklistedStepIndices;
        const newStepIndex = this._adjustedStepBasedOnBlacklist(
            this.props.stepIndex,
            nextIndex,
            this.props.steps.length,
            blacklistedSteps,
        );
        if (newStepIndex !== nextIndex) {
            this.props.setOnboardingStep(newStepIndex);
        }
    }

    private _adjustedStepBasedOnBlacklist(
        currentStep: number,
        nextStep: number,
        totalSteps: number,
        blacklistedSteps: number[],
    ): number {
        if (!blacklistedSteps.includes(nextStep)) {
            return nextStep;
        }
        let newStep = nextStep;
        const op = nextStep >= currentStep ? _.add : _.subtract;
        let didSearch = false;
        while (blacklistedSteps.includes(newStep)) {
            newStep = op(newStep, 1);
            if (newStep < 0) {
                if (didSearch) {
                    break;
                }
                newStep = totalSteps - 1;
                didSearch = true;
            }
            if (newStep >= totalSteps) {
                if (didSearch) {
                    break;
                }
                newStep = 0;
                didSearch = true;
            }
        }
        return newStep;
    }

    private _handleChange(data: CallbackData): void {
        switch (data.action) {
            case 'close':
                this.props.onClose();
                break;
        }
    }
}
