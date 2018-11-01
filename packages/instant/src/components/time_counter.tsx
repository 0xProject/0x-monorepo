import * as React from 'react';

import { timeUtil } from '../util/time';

import { Flex } from './ui/flex';
import { Text } from './ui/text';

export interface TimeCounterProps {
    estimatedTimeMs: number;
    hasEnded: boolean;
}
interface TimeCounterState {
    elapsedSeconds: number;
}

export class TimeCounter extends React.Component<TimeCounterProps, TimeCounterState> {
    public state = {
        elapsedSeconds: 0,
    };
    private _timerId?: number;

    public componentDidMount(): void {
        this._setupTimerBasedOnProps();
    }

    public componentWillUnmount(): void {
        this._clearTimer();
    }

    public componentDidUpdate(prevProps: TimeCounterProps): void {
        if (prevProps.hasEnded !== this.props.hasEnded) {
            this._setupTimerBasedOnProps();
        }
    }

    public render(): React.ReactNode {
        const estimatedTimeSeconds = this.props.estimatedTimeMs / 1000;
        return (
            <Flex justify="space-between">
                <Text>Est. Time ({timeUtil.secondsToHumanDescription(estimatedTimeSeconds)})</Text>
                <Text>Time: {timeUtil.secondsToStopwatchTime(this.state.elapsedSeconds)}</Text>
            </Flex>
        );
    }

    private _setupTimerBasedOnProps(): void {
        this.props.hasEnded ? this._clearTimer() : this._newTimer();
    }

    private _newTimer(): void {
        this._clearTimer();
        this._timerId = window.setInterval(() => {
            this.setState({
                elapsedSeconds: this.state.elapsedSeconds + 1,
            });
        }, 1000);
    }

    private _clearTimer(): void {
        if (this._timerId) {
            window.clearInterval(this._timerId);
        }
    }
}
