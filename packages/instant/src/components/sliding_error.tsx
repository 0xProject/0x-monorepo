import * as React from 'react';

import { ColorOption } from '../style/theme';

import { SlideDownAnimation, SlideUpAnimation } from './animations/slide_animations';

import { Container, Text } from './ui';

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
        <Container marginRight="5px" display="inline" top="3px" position="relative">
            <Text fontSize="20px">{props.icon}</Text>
        </Container>
        <Text fontWeight="500" fontColor={ColorOption.darkOrange}>
            {props.message}
        </Text>
    </Container>
);

export type SlidingDirection = 'up' | 'down';
export interface SlidingErrorProps extends ErrorProps {
    direction: SlidingDirection;
}
export const SlidingError: React.StatelessComponent<SlidingErrorProps> = props => {
    const AnimationComponent = props.direction === 'up' ? SlideUpAnimation : SlideDownAnimation;

    return (
        <AnimationComponent downY="120px">
            <Error icon={props.icon} message={props.message} />
        </AnimationComponent>
    );
};
