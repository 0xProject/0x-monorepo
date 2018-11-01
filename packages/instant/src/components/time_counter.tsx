import * as React from 'react';

import { ONE_SECOND_MS } from '../constants';
import { ColorOption } from '../style/theme';
import { timeUtil } from '../util/time';

import { Container } from './ui/container';
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
        const estimatedTimeSeconds = this.props.estimatedTimeMs / ONE_SECOND_MS;
        return (
            <Flex justify="space-between">
                <Container>
                    <Container marginRight="5px" display="inline">
                        <Text fontWeight={600} fontColor={ColorOption.grey}>
                            Est. Time
                        </Text>
                    </Container>
                    <Text fontColor={ColorOption.grey}>
                        ({timeUtil.secondsToHumanDescription(estimatedTimeSeconds)})
                    </Text>
                </Container>
                <Text fontColor={ColorOption.grey}>
                    Time: {timeUtil.secondsToStopwatchTime(this.state.elapsedSeconds)}
                </Text>
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
        }, ONE_SECOND_MS);
    }

    private _clearTimer(): void {
        if (this._timerId) {
            window.clearInterval(this._timerId);
        }
    }
}
