import * as React from 'react';

import { OnboardingCard, OnboardingCardProps } from 'ts/components/onboarding/onboarding_card';
import { Pointer, PointerDirection } from 'ts/components/ui/pointer';

export type ContinueButtonDisplay = 'enabled' | 'disabled';

export interface OnboardingTooltipProps extends OnboardingCardProps {
    className?: string;
    pointerDirection?: PointerDirection;
}

export const OnboardingTooltip: React.StatelessComponent<OnboardingTooltipProps> = ({
    pointerDirection,
    className,
    ...cardProps,
}) => (
    <Pointer className={className} direction={pointerDirection}>
        <OnboardingCard {...cardProps} />
    </Pointer>
);

OnboardingTooltip.defaultProps = {
    pointerDirection: 'left',
};

OnboardingTooltip.displayName = 'OnboardingTooltip';
