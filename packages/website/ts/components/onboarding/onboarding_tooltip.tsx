import * as React from 'react';

import { OnboardingCard, OnboardingCardProps } from 'ts/components/onboarding/onboarding_card';
import { Pointer, PointerDirection } from 'ts/components/ui/pointer';

export type ContinueButtonDisplay = 'enabled' | 'disabled';

export interface OnboardingTooltipProps extends OnboardingCardProps {
    className?: string;
    pointerDirection?: PointerDirection;
}

export const OnboardingTooltip: React.StatelessComponent<OnboardingTooltipProps> = props => {
    const { pointerDirection, className, ...cardProps } = props;
    return (
        <Pointer className={className} direction={pointerDirection}>
            <OnboardingCard {...cardProps} />
        </Pointer>
    );
};
OnboardingTooltip.defaultProps = {
    pointerDirection: 'left',
};

OnboardingTooltip.displayName = 'OnboardingTooltip';
