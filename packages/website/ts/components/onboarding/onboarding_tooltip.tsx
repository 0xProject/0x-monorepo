import * as React from 'react';

import { OnboardingCard, OnboardingCardProps } from 'ts/components/onboarding/onboarding_card';
import { Pointer, PointerDirection } from 'ts/components/ui/pointer';

export type ContinueButtonDisplay = 'enabled' | 'disabled';
export type TooltipPointerDisplay = PointerDirection | 'none';

export interface OnboardingTooltipProps extends OnboardingCardProps {
    className?: string;
    pointerDisplay?: TooltipPointerDisplay;
}

export const OnboardingTooltip: React.StatelessComponent<OnboardingTooltipProps> = props => {
    const { pointerDisplay, className, ...cardProps } = props;
    const card = <OnboardingCard {...cardProps} />;
    if (pointerDisplay === 'none') {
        return card;
    }
    return (
        <Pointer className={className} direction={pointerDisplay}>
            <OnboardingCard {...cardProps} />
        </Pointer>
    );
};
OnboardingTooltip.defaultProps = {
    pointerDisplay: PointerDirection.Left,
};

OnboardingTooltip.displayName = 'OnboardingTooltip';
