import * as React from 'react';

import { Island } from 'ts/components/ui/island';

export interface OnboardingTooltipProps {
    title: string;
    content: React.ReactNode;
    isLastStep: boolean;
    index: number;
    onClose: () => void;
    onClickNext: () => void;
    onClickBack: () => void;
}

export const OnboardingTooltip: React.StatelessComponent<OnboardingTooltipProps> = (props: OnboardingTooltipProps) => (
    <Island>
        {props.title}
        {props.content}
        <button onClick={props.onClickBack}>Back</button>
        <button onClick={props.onClickNext}>Skip</button>
        <button onClick={props.onClose}>Close</button>
    </Island>
);
