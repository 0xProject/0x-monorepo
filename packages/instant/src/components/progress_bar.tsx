import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Text } from './ui/text';

export interface ProgressBarProps {
    percentageDone: number;
    estTimeMs: number;
    elapsedTimeMs: number;
}

// TODO: Est time to minutes with suffix
// TODO: time in minutes
export const ProgressBar: React.StatelessComponent<ProgressBarProps> = props => (
    <Container padding="20px 20px 0px 20px" width="100%">
        <Container marginBottom="5px">
            <Flex justify="space-between">
                <Text>Est. Time ({props.estTimeMs / 1000} seconds)</Text>
                <Text>{props.elapsedTimeMs / 1000}</Text>
            </Flex>
        </Container>
        <Container width="100%" backgroundColor={ColorOption.lightGrey} borderRadius="6px">
            <Container
                width={`${props.percentageDone}%`}
                backgroundColor={ColorOption.primaryColor}
                borderRadius="6px"
                height="6px"
            />
        </Container>
    </Container>
);
