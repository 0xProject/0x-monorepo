import * as _ from 'lodash';

type HeartbeatableFunction = () => Promise<void>;
export class Heartbeater {
    private _intervalId?: number;
    private _hasPendingRequest: boolean;
    private readonly _performImmediatelyOnStart: boolean;
    private readonly _performFunction: HeartbeatableFunction;

    public constructor(performingFunctionAsync: HeartbeatableFunction, performImmediatelyOnStart: boolean) {
        this._performFunction = performingFunctionAsync;
        this._hasPendingRequest = false;
        this._performImmediatelyOnStart = performImmediatelyOnStart;
    }

    public start(intervalTimeMs: number): void {
        if (!_.isUndefined(this._intervalId)) {
            throw new Error('Heartbeat is running, please stop before restarting');
        }

        if (this._performImmediatelyOnStart) {
            // tslint:disable-next-line:no-floating-promises
            this._trackAndPerformAsync();
        }

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
