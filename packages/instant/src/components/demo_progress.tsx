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
    fromWidth: string;
}
export class DemoProgress extends React.Component<DemoProgressProps, DemoProgressState> {
    private readonly _barRef = React.createRef<HTMLDivElement>();
    public constructor(props: DemoProgressProps) {
        super(props);
        this.state = {
            animationTimeMs: props.expectedTimeMs,
            maxWidthPercent: 25,
            fromWidth: '0%',
        };

        window.setTimeout(() => {
            const curRef = this._barRef.current;
            if (curRef) {
                const fromPxWidth = `${curRef.offsetWidth}px`;
                this.setState({
                    animationTimeMs: 3000,
                    maxWidthPercent: 100,
                    fromWidth: fromPxWidth,
                });
            }
        }, 3000);
    }

    public render(): React.ReactNode {
        // TODO: Consider moving to seperate component
        return (
            <Container padding="20px 20px 0px 20px" width="100%">
                <Container width="100%" backgroundColor={ColorOption.lightGrey} borderRadius="6px">
                    <InnerProgressBarElement
                        fromWidth={this.state.fromWidth}
                        timeMs={this.state.animationTimeMs}
                        maxWidthPercent={this.state.maxWidthPercent}
                        ref={this._barRef as any}
                    />
                </Container>
            </Container>
        );
    }
}

// TODO: 95
const widthKeyframes = (fromWidth: string, maxWidthPercent: number) => {
    // todO: dont use 20%
    return keyframes`
        from {
            width: ${fromWidth}
        }
        to {
            width: ${maxWidthPercent}%;
        }
    `;
};

interface InnerProgressBarElementProps {
    timeMs: number;
    fromWidth: string;
    maxWidthPercent: number;
}
export const InnerProgressBarElement =
    styled.div <
    InnerProgressBarElementProps >
    `
    background-color: black;
    border-radius: 6px;
    height: 6px;
    animation: ${props => widthKeyframes(props.fromWidth, props.maxWidthPercent)} ${props =>
        props.timeMs}ms linear 1 forwards;
    `;
