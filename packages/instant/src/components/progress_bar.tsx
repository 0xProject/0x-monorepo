import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Container } from './ui/container';
import { Text } from './ui/text';

export interface ProgressBarProps {
    percentageDone: number;
}
export const ProgressBar: React.StatelessComponent<ProgressBarProps> = props => (
    <Container width="100%" backgroundColor={ColorOption.white}>
        <Container width={`${props.percentageDone}%`} backgroundColor={ColorOption.black}>
            <Text fontColor={ColorOption.white}>{props.percentageDone}%</Text>
        </Container>
    </Container>
);
