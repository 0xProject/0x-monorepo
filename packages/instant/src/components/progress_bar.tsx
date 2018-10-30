import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Container } from './ui/container';

export interface ProgressBarProps {
    percentageDone: number;
}
export const ProgressBar: React.StatelessComponent<ProgressBarProps> = props => (
    <Container padding="20px 20px 0px 20px" width="100%">
        <Container width="100%" backgroundColor={ColorOption.lightGrey} borderRadius="6px">
            <Container
                width={`${props.percentageDone}%`}
                backgroundColor={ColorOption.primaryColor}
                borderRadius="6px"
                height="10px"
            />
        </Container>
    </Container>
);
