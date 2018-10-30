import * as React from 'react';

import { ColorOption } from '../style/theme';

import { PositionAnimationProps } from './animations/position_animation';
import { SlideAnimation, SlideAnimationPhase } from './animations/slide_animations';

import { Container, Flex, Text } from './ui';

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
    phase: SlideAnimationPhase;
}
export const SlidingError: React.StatelessComponent<SlidingErrorProps> = props => {
    const slideAmount = '120px';
    const slideUp: PositionAnimationProps = {
        timingFunction: 'ease-in',
        top: {
            from: slideAmount,
            to: '0px',
        },
    };
    const slideDown: PositionAnimationProps = {
        timingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        top: {
            from: '0px',
            to: slideAmount,
        },
        direction: 'forwards',
    };
    return (
        <SlideAnimation slideIn={slideUp} slideOut={slideDown} phase={props.phase}>
            <Error icon={props.icon} message={props.message} />
        </SlideAnimation>
    );
};
