import * as _ from 'lodash';
import * as React from 'react';
import { Keyframes } from 'styled-components';

import { PROGRESS_STALL_AT_PERCENTAGE, PROGRESS_TICK_INTERVAL_MS } from '../constants';
import { ColorOption, keyframes, styled } from '../style/theme';
import { timeUtil } from '../util/time';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Text } from './ui/text';

interface DemoProgressProps {
    expectedTimeMs: number;
    // finished: boolean;
}
interface DemoProgressState {
    // max width
    animationTimeMs: number;
}
export class DemoProgress extends React.Component<DemoProgressProps, DemoProgressState> {
    public constructor(props: DemoProgressProps) {
        super(props);
        this.state = {
            animationTimeMs: props.expectedTimeMs,
        };
    }

    public render(): React.ReactNode {
        // TODO: Consider moving to seperate component
        return (
            <Container padding="20px 20px 0px 20px" width="100%">
                <Container width="100%" backgroundColor={ColorOption.lightGrey} borderRadius="6px">
                    <InnerProgressBarElement timeMs={this.state.animationTimeMs} />
                </Container>
            </Container>
        );
    }
}

interface InnerProgressBarElementProps {
    timeMs: number;
}

// TODO: 95
const widthKeyframes = keyframes`
    from {
        width: 0%;
    }
    to {
        width: 100%;
    }

`;

export const InnerProgressBarElement =
    styled.div <
    InnerProgressBarElementProps >
    `
    background-color: black;
    border-radius: 6px;
    height: 6px;
    animation: ${widthKeyframes} ${props => props.timeMs}ms linear 1;
    `;

// animation-fill-mode: forwards;
// animation-duration: ${props => props.timeMs * 1000}s;
// animation-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
// animation-iteration-count: 0;
// animation-delay: 0;
// `;

// export const InnerProgressBarElement =
//     styled.div <
//     InnerProgressBarElementProps >
//     `
//     width: ${props => props.percentageDone}%;
//     background-color: ${props => props.theme[props.backgroundColor]};
//     border-radius: ${props => props.borderRadius};
//     height: ${props => props.height};
//     transition: width ${props => props.transitionTimeMs}ms ease-in-out;
//     `;
