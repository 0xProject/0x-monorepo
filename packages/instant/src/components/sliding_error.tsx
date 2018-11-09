import * as React from 'react';

import { ScreenSpecification } from '../style/media';
import { ColorOption } from '../style/theme';
import { zIndex } from '../style/z_index';

import { PositionAnimationSettings } from './animations/position_animation';
import { SlideAnimation, SlideAnimationState } from './animations/slide_animation';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Text } from './ui/text';

export interface ErrorProps {
    icon: string;
    message: string;
}

export const Error: React.StatelessComponent<ErrorProps> = props => (
    <Container
        padding="10px"
        border={`1px solid ${ColorOption.darkOrange}`}
        backgroundColor={ColorOption.lightOrange}
        width="100%"
        borderRadius="6px"
        marginTop="10px"
        marginBottom="10px"
    >
        <Flex justify="flex-start">
            <Container marginRight="5px" display="inline" top="3px" position="relative">
                <Text fontSize="20px">{props.icon}</Text>
            </Container>
            <Text fontWeight="500" fontColor={ColorOption.darkOrange}>
                {props.message}
            </Text>
        </Flex>
    </Container>
);

export interface SlidingErrorProps extends ErrorProps {
    animationState: SlideAnimationState;
}
export const SlidingError: React.StatelessComponent<SlidingErrorProps> = props => {
    const slideAmount = '120px';

    const desktopSlideIn: PositionAnimationSettings = {
        timingFunction: 'ease-in',
        top: {
            from: slideAmount,
            to: '0px',
        },
        position: 'relative',
    };
    const desktopSlideOut: PositionAnimationSettings = {
        timingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        top: {
            from: '0px',
            to: slideAmount,
        },
        position: 'relative',
    };

    const mobileSlideIn: PositionAnimationSettings = {
        duration: '0.5s',
        timingFunction: 'ease-in',
        top: { from: '-120px', to: '0px' },
        position: 'fixed',
    };
    const moblieSlideOut: PositionAnimationSettings = {
        duration: '0.5s',
        timingFunction: 'ease-in',
        top: { from: '0px', to: '-120px' },
        position: 'fixed',
    };

    const slideUpSettings: ScreenSpecification<PositionAnimationSettings> = {
        default: desktopSlideIn,
        sm: mobileSlideIn,
    };
    const slideOutSettings: ScreenSpecification<PositionAnimationSettings> = {
        default: desktopSlideOut,
        sm: moblieSlideOut,
    };

    return (
        <SlideAnimation
            slideInSettings={slideUpSettings}
            slideOutSettings={slideOutSettings}
            zIndex={{ sm: zIndex.errorPopup, default: zIndex.errorPopBehind }}
            animationState={props.animationState}
        >
            <Error icon={props.icon} message={props.message} />
        </SlideAnimation>
    );
};
