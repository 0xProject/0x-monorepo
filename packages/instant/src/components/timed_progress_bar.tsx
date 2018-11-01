import * as _ from 'lodash';
import * as React from 'react';

import { PROGRESS_FINISH_ANIMATION_TIME_MS, PROGRESS_STALL_AT_PERCENTAGE } from '../constants';
import { ColorOption, keyframes, styled } from '../style/theme';

import { Container } from './ui/container';

export interface TimedProgressBarProps {
    expectedTimeMs: number;
    hasEnded: boolean;
}

/**
 * Timed Progress Bar
 * Goes from 0% -> PROGRESS_STALL_AT_PERCENTAGE% over time of expectedTimeMs
 * When hasEnded set to true, goes to 100% through animation of PROGRESS_FINISH_ANIMATION_TIME_MS length
 */
export class TimedProgressBar extends React.Component<TimedProgressBarProps, {}> {
    private readonly _barRef = React.createRef<HTMLDivElement>();

    public render(): React.ReactNode {
        const timedProgressProps = this._calculateTimedProgressProps();
        return (
            <Container width="100%" backgroundColor={ColorOption.lightGrey} borderRadius="6px">
                <TimedProgress {...timedProgressProps} ref={this._barRef as any} />
            </Container>
        );
    }

    private _calculateTimedProgressProps(): TimedProgressProps {
        if (this.props.hasEnded) {
            if (!this._barRef.current) {
                throw new Error('ended but no reference');
            }
            const fromWidth = `${this._barRef.current.offsetWidth}px`;
            return {
                timeMs: PROGRESS_FINISH_ANIMATION_TIME_MS,
                fromWidth,
                maxWidthPercent: 100,
            };
        }

        return {
            timeMs: this.props.expectedTimeMs,
            fromWidth: '0px',
            maxWidthPercent: PROGRESS_STALL_AT_PERCENTAGE,
        };
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
