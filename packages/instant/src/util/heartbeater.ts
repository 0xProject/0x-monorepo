import { intervalUtils } from '@0x/utils';
import * as _ from 'lodash';

type HeartbeatableFunction = () => Promise<void>;
export class Heartbeater {
    private _intervalId?: NodeJS.Timer;
    private readonly _performImmediatelyOnStart: boolean;
    private readonly _performFunction: HeartbeatableFunction;

    public constructor(performingFunctionAsync: HeartbeatableFunction, performImmediatelyOnStart: boolean) {
        this._performFunction = performingFunctionAsync;
        this._performImmediatelyOnStart = performImmediatelyOnStart;
    }

    public start(intervalTimeMs: number): void {
        if (this._intervalId !== undefined) {
            throw new Error('Heartbeat is running, please stop before restarting');
        }

        if (this._performImmediatelyOnStart) {
            // tslint:disable-next-line:no-floating-promises
            this._performFunction();
        }

        // tslint:disable-next-line:no-unbound-method
        this._intervalId = intervalUtils.setAsyncExcludingInterval(this._performFunction, intervalTimeMs, _.noop);
    }

    public stop(): void {
        if (this._intervalId) {
            intervalUtils.clearInterval(this._intervalId);
        }
        this._intervalId = undefined;
    }
}
