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
    maxWidthPercent: number;
}
export class DemoProgress extends React.Component<DemoProgressProps, DemoProgressState> {
    public myRef?: any;
    public constructor(props: DemoProgressProps) {
        super(props);
        this.state = {
            animationTimeMs: props.expectedTimeMs,
            maxWidthPercent: 25,
        };
        this.myRef = React.createRef();

        window.setTimeout(() => {
            console.log('going!');
            console.log(this.myRef);
            this.setState({
                animationTimeMs: 1000,
                maxWidthPercent: 100,
            });
        }, 3000);
    }

    public render(): React.ReactNode {
        // TODO: Consider moving to seperate component
        return (
            <Container padding="20px 20px 0px 20px" width="100%">
                <Container width="100%" backgroundColor={ColorOption.lightGrey} borderRadius="6px">
                    <InnerProgressBarElement
                        timeMs={this.state.animationTimeMs}
                        maxWidthPercent={this.state.maxWidthPercent}
                        ref={this.myRef}
                    />
                </Container>
            </Container>
        );
    }
}

// TODO: 95
const widthKeyframes = (maxWidthPercent: number) => {
    // todO: dont use 20%
    return keyframes`
        from {
            width: 0%;
        }
        to {
            width: ${maxWidthPercent}%;
        }
    `;
};

interface InnerProgressBarElementProps {
    timeMs: number;
    maxWidthPercent: number;
}
export const InnerProgressBarElement =
    styled.div <
    InnerProgressBarElementProps >
    `
    background-color: black;
    border-radius: 6px;
    height: 6px;
    animation: ${props => widthKeyframes(props.maxWidthPercent)} ${props => props.timeMs}ms linear 1 forwards;
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
