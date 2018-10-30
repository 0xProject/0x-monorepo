// TODO: change filename?
import * as _ from 'lodash';
import { Dispatch } from 'redux';

import { PROGRESS_STALL_AT_PERCENTAGE, PROGRESS_TICK_INTERVAL_MS } from '../constants';
import { Action, actions } from '../redux/actions';

const curTimeUnix = () => {
    return new Date().getTime();
};

enum TickingState {
    None,
    Running,
    Finishing,
}
interface TickingNoneState {
    state: TickingState.None;
}
interface TickingRunningStatus {
    state: TickingState.Running;
}
interface TickingFinishingStatus {
    state: TickingState.Finishing;
    increasePercentageEveryTick: number;
}
type TickingStatus = TickingNoneState | TickingRunningStatus | TickingFinishingStatus;

const TICKS_PER_SECOND = 1000 / PROGRESS_TICK_INTERVAL_MS;
class Progress {
    private _startTimeUnix?: number;
    private _expectedTimeMs?: number;
    private _intervalId?: number;
    private _percentageDone: number;
    private _tickingStatus: TickingStatus;
    private _dispatcher: Dispatch<Action>;

    constructor(dispatcher: Dispatch<Action>) {
        this._startTimeUnix = undefined;
        this._expectedTimeMs = undefined;
        this._percentageDone = 0;
        this._intervalId = undefined;
        this._tickingStatus = { state: TickingState.None };
        this._dispatcher = dispatcher;
    }

    public beginRunning(expectedTimeMs: number): void {
        this._clearTimer();
        this._startTimeUnix = curTimeUnix();
        this._expectedTimeMs = expectedTimeMs;
        this._percentageDone = 0;
        this._intervalId = window.setInterval(this._tick.bind(this), PROGRESS_TICK_INTERVAL_MS);
        this._tickingStatus = { state: TickingState.Running };
    }

    public setFinishing(): void {
        const percentLeft = 100 - this._percentageDone;
        const increasePercentageEveryTick = percentLeft / TICKS_PER_SECOND;
        this._tickingStatus = {
            state: TickingState.Finishing,
            increasePercentageEveryTick,
        };
    }

    private _tick(): void {
        const rawPercentageDone =
            this._tickingStatus.state === TickingState.Finishing
                ? this._getNewPercentageFinishing(this._tickingStatus)
                : this._getNewPercentageNormal();

        const maxPercentage = this._tickingStatus.state === TickingState.Finishing ? 100 : PROGRESS_STALL_AT_PERCENTAGE;
        const percentageDone = Math.floor(Math.min(rawPercentageDone, maxPercentage));
        this._percentageDone = percentageDone;
        this._dispatcher(actions.updateOrderProgressPercentage(this._percentageDone));
        console.log('percentageDone', this._percentageDone);
        if (percentageDone >= 100) {
            this._clearTimer();
        }
        return;
    }

    private _clearTimer(): void {
        if (this._intervalId) {
            window.clearTimeout(this._intervalId);
        }
    }

    private _getNewPercentageNormal(): number {
        if (_.isUndefined(this._startTimeUnix) || _.isUndefined(this._expectedTimeMs)) {
            throw new Error('Cant tick, missing var');
        }

        const elapsedTimeMs = curTimeUnix() - this._startTimeUnix;
        const safeElapsedTimeMs = Math.max(elapsedTimeMs, 1);
        const percentageDone = safeElapsedTimeMs / this._expectedTimeMs * 100;
        return percentageDone;
    }

    private _getNewPercentageFinishing(finishingState: TickingFinishingStatus): number {
        return this._percentageDone + finishingState.increasePercentageEveryTick;
    }
}

let _currentProgress: Progress | undefined;
export const progress = (dispatcher: Dispatch<Action>): Progress => {
    _currentProgress = _currentProgress || new Progress(dispatcher);
    return _currentProgress;
};
