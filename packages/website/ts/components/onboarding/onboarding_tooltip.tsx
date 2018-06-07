import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { Island } from 'ts/components/ui/island';

export type ContinueButtonDisplay = 'enabled' | 'disabled';

export interface OnboardingTooltipProps {
    title?: string;
    content: React.ReactNode;
    isLastStep: boolean;
    onClose: () => void;
    onClickNext: () => void;
    onClickBack: () => void;
    continueButtonDisplay?: ContinueButtonDisplay;
    hideBackButton?: boolean;
    hideNextButton?: boolean;
}

// TODO: Make this more general button.
export interface ContinueButtonProps {
    display: ContinueButtonDisplay;
    children?: string;
    onClick: () => void;
}

export const ContinueButton: React.StatelessComponent<ContinueButtonProps> = (props: ContinueButtonProps) => {
    const isDisabled = props.display === 'disabled';
    return (
        <button disabled={isDisabled} onClick={isDisabled ? undefined : props.onClick}>
            {props.children}
        </button>
    );
};

export const OnboardingTooltip: React.StatelessComponent<OnboardingTooltipProps> = (props: OnboardingTooltipProps) => (
    <Island>
        <Container paddingRight="30px" paddingLeft="30px" maxWidth={350} paddingTop="15px" paddingBottom="15px">
            <div className="flex flex-column">
                {props.title}
                {props.content}
                {props.continueButtonDisplay && (
                    <ContinueButton onClick={props.onClickNext} display={props.continueButtonDisplay}>
                        Continue
                    </ContinueButton>
                )}
                {!props.hideBackButton && <button onClick={props.onClickBack}>Back</button>}
                {!props.hideNextButton && <button onClick={props.onClickNext}>Skip</button>}
                <button onClick={props.onClose}>Close</button>
            </div>
        </Container>
    </Island>
);

OnboardingTooltip.displayName = 'OnboardingTooltip';
