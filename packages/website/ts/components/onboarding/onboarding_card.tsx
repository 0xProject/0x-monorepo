import { colors } from '@0x/react-shared';
import * as React from 'react';

import * as _ from 'lodash';
import { Button } from 'ts/components/ui/button';
import { Container } from 'ts/components/ui/container';
import { IconButton } from 'ts/components/ui/icon_button';
import { Island } from 'ts/components/ui/island';
import { Text, Title } from 'ts/components/ui/text';

export type ContinueButtonDisplay = 'enabled' | 'disabled';

export interface OnboardingCardProps {
    title?: string;
    shouldCenterTitle?: boolean;
    content: React.ReactNode;
    isLastStep: boolean;
    onClose: () => void;
    onClickNext: () => void;
    onClickBack: () => void;
    onContinueButtonClick?: () => void;
    continueButtonDisplay?: ContinueButtonDisplay;
    shouldHideBackButton?: boolean;
    shouldHideNextButton?: boolean;
    continueButtonText?: string;
    borderRadius?: string;
    // Used for super-custom content.
    shouldRemoveExtraSpacing?: boolean;
}

export const OnboardingCard: React.StatelessComponent<OnboardingCardProps> = ({
    title,
    shouldCenterTitle,
    content,
    continueButtonDisplay,
    continueButtonText,
    onContinueButtonClick,
    onClickNext,
    onClickBack,
    onClose,
    shouldHideBackButton,
    shouldHideNextButton,
    borderRadius,
    shouldRemoveExtraSpacing,
}) => {
    const padding = shouldRemoveExtraSpacing
        ? {}
        : {
              paddingRight: '30px',
              paddingLeft: '30px',
              paddingTop: '15px',
              paddingBottom: '15px',
          };
    const closeIconPositioning = shouldRemoveExtraSpacing
        ? { right: '15px', bottom: '3px' }
        : { bottom: '20px', left: '15px' };
    return (
        <Island borderRadius={borderRadius}>
            <Container {...padding}>
                <div className="flex flex-column">
                    <Container className="flex justify-between">
                        <Container width="100%">
                            <Title center={shouldCenterTitle}>{title}</Title>
                        </Container>
                        <Container position="relative" {...closeIconPositioning}>
                            <IconButton color={colors.grey} iconName="zmdi-close" onClick={onClose}>
                                Close
                            </IconButton>
                        </Container>
                    </Container>
                    <Container marginBottom={shouldRemoveExtraSpacing ? undefined : '15px'}>
                        <Text>{content}</Text>
                    </Container>
                    {continueButtonDisplay && (
                        <Button
                            isDisabled={continueButtonDisplay === 'disabled'}
                            onClick={!_.isUndefined(onContinueButtonClick) ? onContinueButtonClick : onClickNext}
                            fontColor={colors.white}
                            fontSize="15px"
                            backgroundColor={colors.mediumBlue}
                        >
                            {continueButtonText}
                        </Button>
                    )}
                    {!(shouldHideBackButton && shouldHideNextButton) && (
                        <Container className="clearfix" marginTop="15px">
                            <div className="left">
                                {!shouldHideBackButton && (
                                    <Text fontColor={colors.grey} onClick={onClickBack}>
                                        Back
                                    </Text>
                                )}
                            </div>
                            <div className="right">
                                {!shouldHideNextButton && (
                                    <Text fontColor={colors.grey} onClick={onClickNext}>
                                        Skip
                                    </Text>
                                )}
                            </div>
                        </Container>
                    )}
                </div>
            </Container>
        </Island>
    );
};

OnboardingCard.defaultProps = {
    continueButtonText: 'Continue',
    shouldCenterTitle: false,
    shouldRemoveExtraSpacing: false,
};

OnboardingCard.displayName = 'OnboardingCard';
