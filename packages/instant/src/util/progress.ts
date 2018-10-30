import { Dispatch } from 'redux';

import { PROGRESS_TICK_INTERVAL_MS } from '../constants';
import { Action, actions } from '../redux/actions';

const curTimeUnix = () => {
    return new Date().getTime();
};

enum TickingState {
    Ticking,
    Finishing,
}
interface TickingNormalState {
    state: TickingState.Ticking;
}
interface TickingFinishingState {
    state: TickingState.Finishing;
    increasePercentageEveryTick: number;
}
type TickingStatus = TickingNormalState | TickingFinishingState;

const TICKS_PER_SECOND = 1000 / PROGRESS_TICK_INTERVAL_MS;
export class Progress {
    private _startTimeUnix: number;
    private _expectedTimeMs: number;
    private _intervalId: number;
    private _percentageDone: number;
    private _tickingStatus: TickingStatus;

    // TODO: take in dispatch
    constructor(expectedTimeMs: number) {
        const curTime = curTimeUnix();
        this._startTimeUnix = curTime;
        this._expectedTimeMs = expectedTimeMs;
        this._percentageDone = 0;
        this._intervalId = window.setInterval(this._tick.bind(this), PROGRESS_TICK_INTERVAL_MS); // TODO: is bind necessary?
        this._tickingStatus = { state: TickingState.Ticking };
        // TODO: clear interval
    }

    public setFinishing(): void {
        const percentLeft = 100 - this._percentageDone;
        console.log('percentLeft', percentLeft);
        const increasePercentageEveryTick = percentLeft / TICKS_PER_SECOND;
        console.log('increase Tick', increasePercentageEveryTick);
        this._tickingStatus = {
            state: TickingState.Finishing,
            increasePercentageEveryTick,
        };
    }

    private _tick(): void {
        const percentageDone =
            this._tickingStatus.state === TickingState.Finishing
                ? this._tickFinishing(this._tickingStatus)
                : this._tickNormal();

        // TODO: max 100

        this._percentageDone = percentageDone;
        console.log('percentageDone', this._percentageDone);
        // TODO: max 95
        if (percentageDone >= 100) {
            this._clearInterval();
        }
        return;
    }

    // TODO: take param and move out
    private _tickNormal(): number {
        const elapsedTimeMs = curTimeUnix() - this._startTimeUnix;
        // TODO: zero and negative check, use mins and maxs everywhere
        const percentageDone = elapsedTimeMs / this._expectedTimeMs * 100;
        return percentageDone;
    }

    private _tickFinishing(finishingState: TickingFinishingState): number {
        return this._percentageDone + finishingState.increasePercentageEveryTick;
    }

    private _clearInterval(): void {
        return window.clearInterval(this._intervalId);
    }

    // reset function

    // end function
}
