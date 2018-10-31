import * as _ from 'lodash';
import * as React from 'react';
import { Keyframes } from 'styled-components';

import { PROGRESS_FINISH_ANIMATION_TIME_MS, PROGRESS_STALL_AT_PERCENTAGE } from '../constants';
import { ColorOption, keyframes, styled } from '../style/theme';
import { timeUtil } from '../util/time';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Text } from './ui/text';

export interface TimedProgressBarProps {
    expectedTimeMs: number;
    ended: boolean;
}

interface TimedProgressBarState {
    animationTimeMs: number;
    animationStartingWidth: string;
    maxWidthPercent: number;
}

export const beginningState = (props: TimedProgressBarProps): TimedProgressBarState => {
    return {
        animationTimeMs: props.expectedTimeMs,
        animationStartingWidth: '0%',
        maxWidthPercent: PROGRESS_STALL_AT_PERCENTAGE,
    };
};

export class TimedProgressBar extends React.Component<TimedProgressBarProps, TimedProgressBarState> {
    private readonly _barRef = React.createRef<HTMLDivElement>();

    public constructor(props: TimedProgressBarProps) {
        super(props);
        this.state = beginningState(props);
    }

    public componentDidUpdate(prevProps: TimedProgressBarProps, prevState: TimedProgressBarState): void {
        if (prevProps.ended === false && this.props.ended === true) {
            // Show nice animation going to end
            // barRef current should always exist, but checking for typesafety
            if (this._barRef.current) {
                const curProgressWidth = this._barRef.current.offsetWidth;
                this.setState({
                    animationTimeMs: PROGRESS_FINISH_ANIMATION_TIME_MS,
                    animationStartingWidth: `${curProgressWidth}px`,
                    maxWidthPercent: 100,
                });
            }
            return;
        }

        if (prevProps.expectedTimeMs !== this.props.expectedTimeMs || prevProps.ended !== this.props.ended) {
            // things changed, get fresh state
            this.setState(beginningState(this.props));
        }
    }

    public render(): React.ReactNode {
        return (
            <Container width="100%" backgroundColor={ColorOption.lightGrey} borderRadius="6px">
                <TimedProgress
                    fromWidth={this.state.animationStartingWidth}
                    timeMs={this.state.animationTimeMs}
                    maxWidthPercent={this.state.maxWidthPercent}
                    ref={this._barRef as any}
                />
            </Container>
        );
    }
}

const expandingWidthKeyframes = (fromWidth: string, maxWidthPercent: number) => {
    return keyframes`
          from {
              width: ${fromWidth}
          }
          to {
              width: ${maxWidthPercent}%;
          }
      `;
};

interface TimedProgressProps {
    timeMs: number;
    fromWidth: string;
    maxWidthPercent: number;
}
// TODO use PrimaryColor instead of black
export const TimedProgress =
    styled.div <
    TimedProgressProps >
    `
    background-color: black;
    border-radius: 6px;
    height: 6px;
    animation: ${props => expandingWidthKeyframes(props.fromWidth, props.maxWidthPercent)}
      ${props => props.timeMs}ms linear 1 forwards;
  `;
