import * as _ from 'lodash';
import * as React from 'react';
import { Placement, Popper, PopperChildrenProps } from 'react-popper';

import { OnboardingTooltip } from 'ts/components/onboarding/onboarding_tooltip';
import { Container } from 'ts/components/ui/container';
import { Overlay } from 'ts/components/ui/overlay';
import { zIndex } from 'ts/utils/style';

export interface Step {
    target: string;
    title?: string;
    content: React.ReactNode;
    placement?: Placement;
    hideBackButton?: boolean;
}

export interface OnboardingFlowProps {
    steps: Step[];
    stepIndex: number;
    isRunning: boolean;
    onClose: () => void;
    updateOnboardingStep: (stepIndex: number) => void;
}

export class OnboardingFlow extends React.Component<OnboardingFlowProps> {
    public render(): React.ReactNode {
        if (!this.props.isRunning) {
            return null;
        }
        return (
            <Overlay>
                <Popper referenceElement={this._getElementForStep()} placement={this._getCurrentStep().placement}>
                    {this._renderPopperChildren.bind(this)}
                </Popper>
            </Overlay>
        );
    }

    private _getElementForStep(): Element {
        return document.querySelector(this._getCurrentStep().target);
    }

    private _renderPopperChildren(props: PopperChildrenProps): React.ReactNode {
        return (
            <div ref={props.ref} style={props.style} data-placement={props.placement}>
                {this._renderToolTip()}
            </div>
        );
    }

    private _renderToolTip(): React.ReactNode {
        const { steps, stepIndex } = this.props;
        const step = steps[stepIndex];
        const isLastStep = steps.length - 1 === stepIndex;
        return (
            <Container marginLeft="15px">
                <OnboardingTooltip
                    title={step.title}
                    content={step.content}
                    isLastStep={isLastStep}
                    hideBackButton={step.hideBackButton}
                    onClose={this.props.onClose}
                    onClickNext={this._goToNextStep.bind(this)}
                    onClickBack={this._goToPrevStep.bind(this)}
                />
            </Container>
        );
    }

    private _getCurrentStep(): Step {
        return this.props.steps[this.props.stepIndex];
    }

    private _goToNextStep(): void {
        const nextStep = this.props.stepIndex + 1;
        if (nextStep < this.props.steps.length) {
            this.props.updateOnboardingStep(nextStep);
        } else {
            this.props.onClose();
        }
    }

    private _goToPrevStep(): void {
        const nextStep = this.props.stepIndex - 1;
        if (nextStep >= 0) {
            this.props.updateOnboardingStep(nextStep);
        } else {
            this.props.onClose();
        }
    }
}
