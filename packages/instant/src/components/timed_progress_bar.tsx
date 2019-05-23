import * as _ from 'lodash';
import { transparentize } from 'polished';
import * as React from 'react';

import { PROGRESS_FINISH_ANIMATION_TIME_MS, PROGRESS_STALL_AT_WIDTH } from '../constants';
import { ColorOption, css, keyframes, styled, ThemeConsumer } from '../style/theme';

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
export class TimedProgressBar extends React.PureComponent<TimedProgressBarProps, {}> {
    private readonly _barRef = React.createRef<HTMLDivElement>();

    public render(): React.ReactNode {
        const widthAnimationSettings = this._calculateWidthAnimationSettings();
        return <ProgressBar animationSettings={widthAnimationSettings} ref={this._barRef} />;
    }

    private _calculateWidthAnimationSettings(): WidthAnimationSettings {
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

export interface WidthAnimationSettings {
    timeMs: number;
    fromWidth: string;
    toWidth: string;
}

interface ProgressProps {
    width?: string;
    animationSettings?: WidthAnimationSettings;
}

export const Progress = styled.div<ProgressProps>`
    && {
        background-color: ${props => props.theme[ColorOption.primaryColor]};
        border-radius: 6px;
        height: 6px;
        ${props => (props.width ? `width: ${props.width};` : '')}
        ${props =>
            props.animationSettings
                ? css`
                      animation: ${expandingWidthKeyframes(
                              props.animationSettings.fromWidth,
                              props.animationSettings.toWidth,
                          )}
                          ${props.animationSettings.timeMs}ms linear 1 forwards;
                  `
                : ''}
    }
`;

export interface ProgressBarProps extends ProgressProps {}

export const ProgressBar: React.ComponentType<ProgressBarProps & React.ClassAttributes<{}>> = React.forwardRef(
    (props, ref) => (
        <ThemeConsumer>
            {theme => (
                <Container
                    width="100%"
                    borderRadius="6px"
                    rawBackgroundColor={transparentize(0.5, theme[ColorOption.primaryColor])}
                >
                    <Progress {...props} ref={ref as any} />
                </Container>
            )}
        </ThemeConsumer>
    ),
);
