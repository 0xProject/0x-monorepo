import * as _ from 'lodash';

type HeartbeatableFunction = () => Promise<void>;
export class Heartbeater {
    private _intervalId?: number;
    private _pendingRequest: boolean;
    private _performingFunctionAsync: HeartbeatableFunction;

    public constructor(_performingFunctionAsync: HeartbeatableFunction) {
        this._performingFunctionAsync = _performingFunctionAsync;
        this._pendingRequest = false;
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
        this._pendingRequest = false;
    }

    private async _trackAndPerformAsync(): Promise<void> {
        if (this._pendingRequest) {
            return;
        }

        this._pendingRequest = true;
        try {
            await this._performingFunctionAsync();
        } finally {
            this._pendingRequest = false;
        }
    }
}
