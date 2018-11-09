import * as _ from 'lodash';

type HeartbeatableFunction = () => Promise<void>;
export class Heartbeater {
    private _intervalId?: number;
    private _hasPendingRequest: boolean;
    private _performFunction: HeartbeatableFunction;

    public constructor(_performingFunctionAsync: HeartbeatableFunction) {
        this._performFunction = _performingFunctionAsync;
        this._hasPendingRequest = false;
    }

    public start(intervalTimeMs: number): void {
        if (!_.isUndefined(this._intervalId)) {
            throw new Error('Heartbeat is running, please stop before restarting');
        }
        this._trackAndPerformAsync();
        this._intervalId = window.setInterval(this._trackAndPerformAsync.bind(this), intervalTimeMs);
    }

    public stop(): void {
        if (this._intervalId) {
            window.clearInterval(this._intervalId);
        }
        this._intervalId = undefined;
        this._hasPendingRequest = false;
    }

    private async _trackAndPerformAsync(): Promise<void> {
        if (this._hasPendingRequest) {
            return;
        }

        this._hasPendingRequest = true;
        try {
            await this._performFunction();
        } finally {
            this._hasPendingRequest = false;
        }
    }
}
