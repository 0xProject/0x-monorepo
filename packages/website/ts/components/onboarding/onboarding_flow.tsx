import * as React from 'react';
import { Placement, Popper, PopperChildrenProps } from 'react-popper';

import { OnboardingCard } from 'ts/components/onboarding/onboarding_card';
import {
    ContinueButtonDisplay,
    OnboardingTooltip,
    TooltipPointerDisplay,
} from 'ts/components/onboarding/onboarding_tooltip';
import { Animation } from 'ts/components/ui/animation';
import { Container } from 'ts/components/ui/container';
import { Overlay } from 'ts/components/ui/overlay';
import { zIndex } from 'ts/style/z_index';

export interface FixedPositionSettings {
    type: 'fixed';
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    tooltipPointerDisplay?: TooltipPointerDisplay;
}

export interface TargetPositionSettings {
    type: 'target';
    target: string;
    placement: Placement;
}

export interface Step {
    // Provide either a CSS selector, or fixed position settings. Only applies to desktop.
    position: TargetPositionSettings | FixedPositionSettings;
    title?: string;
    shouldCenterTitle?: boolean;
    content: React.ReactNode;
    shouldHideBackButton?: boolean;
    shouldHideNextButton?: boolean;
    continueButtonDisplay?: ContinueButtonDisplay;
    continueButtonText?: string;
    onContinueButtonClick?: () => void;
    // Only used for very custom steps.
    shouldRemoveExtraSpacing?: boolean;
}

export interface OnboardingFlowProps {
    steps: Step[];
    stepIndex: number;
    isRunning: boolean;
    onClose: () => void;
    updateOnboardingStep: (stepIndex: number) => void;
    disableOverlay?: boolean;
    isMobile: boolean;
    disableCloseOnClickOutside?: boolean;
}

export class OnboardingFlow extends React.Component<OnboardingFlowProps> {
    public static defaultProps = {
        disableOverlay: false,
        isMobile: false,
        disableCloseOnClickOutside: false,
    };
    public render(): React.ReactNode {
        if (!this.props.isRunning) {
            return null;
        }
        let onboardingElement = null;
        const currentStep = this._getCurrentStep();
        if (this.props.isMobile) {
            onboardingElement = <Animation type="easeUpFromBottom">{this._renderOnboardingCard()}</Animation>;
        } else if (currentStep.position.type === 'target') {
            const { placement, target } = currentStep.position;
            onboardingElement = (
                <Popper referenceElement={document.querySelector(target)} placement={placement} positionFixed={true}>
                    {this._renderPopperChildren.bind(this)}
                </Popper>
            );
        } else if (currentStep.position.type === 'fixed') {
            const { top, right, bottom, left, tooltipPointerDisplay } = currentStep.position;
            onboardingElement = (
                <Container
                    position="fixed"
                    zIndex={zIndex.aboveOverlay}
                    top={top}
                    right={right}
                    bottom={bottom}
                    left={left}
                >
                    {this._renderToolTip(tooltipPointerDisplay)}
                </Container>
            );
        }
        if (this.props.disableOverlay) {
            return onboardingElement;
        }
        return (
            <div>
                <Overlay onClick={this.props.disableCloseOnClickOutside ? undefined : this.props.onClose} />
                {onboardingElement}
            </div>
        );
    }
    private _renderPopperChildren(props: PopperChildrenProps): React.ReactNode {
        const customStyles = { zIndex: zIndex.aboveOverlay };
        // On re-render, we want to re-center the popper.
        props.scheduleUpdate();
        return (
            <div ref={props.ref} style={{ ...props.style, ...customStyles }} data-placement={props.placement}>
                {this._renderToolTip()}
            </div>
        );
    }
    private _renderToolTip(tooltipPointerDisplay?: TooltipPointerDisplay): React.ReactNode {
        const { steps, stepIndex } = this.props;
        const step = steps[stepIndex];
        const isLastStep = steps.length - 1 === stepIndex;
        return (
            <Container marginLeft="30px" width="400px">
                <OnboardingTooltip
                    title={step.title}
                    shouldCenterTitle={step.shouldCenterTitle}
                    content={step.content}
                    isLastStep={isLastStep}
                    shouldHideBackButton={step.shouldHideBackButton}
                    shouldHideNextButton={step.shouldHideNextButton}
                    onClose={this.props.onClose}
                    onClickNext={this._goToNextStep.bind(this)}
                    onClickBack={this._goToPrevStep.bind(this)}
                    continueButtonDisplay={step.continueButtonDisplay}
                    continueButtonText={step.continueButtonText}
                    onContinueButtonClick={step.onContinueButtonClick}
                    pointerDisplay={tooltipPointerDisplay}
                    shouldRemoveExtraSpacing={step.shouldRemoveExtraSpacing}
                />
            </Container>
        );
    }

    private _renderOnboardingCard(): React.ReactNode {
        const { steps, stepIndex } = this.props;
        const step = steps[stepIndex];
        const isLastStep = steps.length - 1 === stepIndex;
        return (
            <Container position="relative" zIndex={1}>
                <OnboardingCard
                    title={step.title}
                    shouldCenterTitle={step.shouldCenterTitle}
                    content={step.content}
                    isLastStep={isLastStep}
                    shouldHideBackButton={step.shouldHideBackButton}
                    shouldHideNextButton={step.shouldHideNextButton}
                    onClose={this.props.onClose}
                    onClickNext={this._goToNextStep.bind(this)}
                    onClickBack={this._goToPrevStep.bind(this)}
                    continueButtonDisplay={step.continueButtonDisplay}
                    continueButtonText={step.continueButtonText}
                    onContinueButtonClick={step.onContinueButtonClick}
                    borderRadius="10px 10px 0px 0px"
                    shouldRemoveExtraSpacing={step.shouldRemoveExtraSpacing}
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
