import { colors } from '@0xproject/react-shared';
import * as React from 'react';

import { Button } from 'ts/components/ui/button';
import { Container } from 'ts/components/ui/container';
import { IconButton } from 'ts/components/ui/icon_button';
import { Island } from 'ts/components/ui/island';
import { Text, Title } from 'ts/components/ui/text';

export type ContinueButtonDisplay = 'enabled' | 'disabled';

export interface OnboardingCardProps {
    title?: string;
    content: React.ReactNode;
    isLastStep: boolean;
    onClose: () => void;
    onClickNext: () => void;
    onClickBack: () => void;
    continueButtonDisplay?: ContinueButtonDisplay;
    shouldHideBackButton?: boolean;
    shouldHideNextButton?: boolean;
    continueButtonText?: string;
    borderRadius?: string;
}

export const OnboardingCard: React.StatelessComponent<OnboardingCardProps> = ({
    title,
    content,
    continueButtonDisplay,
    continueButtonText,
    onClickNext,
    onClickBack,
    onClose,
    shouldHideBackButton,
    shouldHideNextButton,
    borderRadius,
}) => (
    <Island borderRadius={borderRadius}>
        <Container paddingRight="30px" paddingLeft="30px" maxWidth={350} paddingTop="15px" paddingBottom="15px">
            <div className="flex flex-column">
                <div className="flex justify-between">
                    <Title>{title}</Title>
                    <Container position="relative" bottom="20px" left="15px">
                        <IconButton color={colors.grey} iconName="zmdi-close" onClick={onClose}>
                            Close
                        </IconButton>
                    </Container>
                </div>
                <Container marginBottom="15px">
                    <Text>{content}</Text>
                </Container>
                {continueButtonDisplay && (
                    <Button
                        isDisabled={continueButtonDisplay === 'disabled'}
                        onClick={onClickNext}
                        fontColor={colors.white}
                        fontSize="15px"
                        backgroundColor={colors.mediumBlue}
                    >
                        {continueButtonText}
                    </Button>
                )}
                <Container className="flex justify-between" marginTop="15px">
                    {!shouldHideBackButton && (
                        <Text fontColor={colors.grey} onClick={onClickBack}>
                            Back
                        </Text>
                    )}
                    {!shouldHideNextButton && (
                        <Text fontColor={colors.grey} onClick={onClickNext}>
                            Skip
                        </Text>
                    )}
                </Container>
            </div>
        </Container>
    </Island>
);

OnboardingCard.defaultProps = {
    continueButtonText: 'Continue',
};

OnboardingCard.displayName = 'OnboardingCard';
