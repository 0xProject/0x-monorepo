import * as React from 'react';

import { ColorOption } from '../style/theme';

import { SlideUpAndDownAnimation } from './animations/slide_up_and_down_animation';

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
        <Container marginRight="5px" display="inline">
            {props.icon}
        </Container>
        <Text fontWeight="500" fontColor={ColorOption.darkOrange}>
            {props.message}
        </Text>
    </Container>
);

export const SlidingError: React.StatelessComponent<ErrorProps> = props => (
    <SlideUpAndDownAnimation downY="120px" delayMs={5000}>
        <Error icon={props.icon} message={props.message} />
    </SlideUpAndDownAnimation>
);
