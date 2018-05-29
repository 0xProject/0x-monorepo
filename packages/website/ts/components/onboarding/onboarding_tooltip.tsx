import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { Island } from 'ts/components/ui/island';

export interface OnboardingTooltipProps {
    title?: string;
    content: React.ReactNode;
    isLastStep: boolean;
    onClose: () => void;
    onClickNext: () => void;
    onClickBack: () => void;
}

export const OnboardingTooltip: React.StatelessComponent<OnboardingTooltipProps> = (props: OnboardingTooltipProps) => (
    <Island>
        <Container paddingRight="30px" paddingLeft="30px" maxWidth={350} paddingTop="15px" paddingBottom="15px">
            <div className="flex flex-column">
                {props.title}
                {props.content}
                <button onClick={props.onClickBack}>Back</button>
                <button onClick={props.onClickNext}>Skip</button>
                <button onClick={props.onClose}>Close</button>
            </div>
        </Container>
    </Island>
);
