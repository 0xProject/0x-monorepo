import * as _ from 'lodash';
import * as React from 'react';

import { PROGRESS_FINISH_ANIMATION_TIME_MS, PROGRESS_STALL_AT_WIDTH } from '../constants';
import { ColorOption, keyframes, styled } from '../style/theme';

import { Container } from './ui/container';

export interface TimedProgressBarProps {
    expectedTimeMs: number;
    hasEnded: boolean;
}

/**
 * Timed Progress Bar
 * Goes from 0% -> PROGRESS_STALL_AT_WIDTH over time of expectedTimeMs
 * When hasEnded set to true, goes to 100% through animation of PROGRESS_FINISH_ANIMATION_TIME_MS length of time
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
                toWidth: '100%',
            };
        }

        return {
            timeMs: this.props.expectedTimeMs,
            fromWidth: '0px',
            toWidth: PROGRESS_STALL_AT_WIDTH,
        };
    }
}

const expandingWidthKeyframes = (fromWidth: string, toWidth: string) => {
    return keyframes`
          from {
              width: ${fromWidth};
          }
          to {
              width: ${toWidth};
          }
      `;
};

interface TimedProgressProps {
    timeMs: number;
    fromWidth: string;
    toWidth: string;
}

export const TimedProgress =
    styled.div <
    TimedProgressProps >
    `
    && {
        background-color: ${props => props.theme[ColorOption.primaryColor]};
        border-radius: 6px;
        height: 6px;
        animation: ${props => expandingWidthKeyframes(props.fromWidth, props.toWidth)}
          ${props => props.timeMs}ms linear 1 forwards;
    }
`;
