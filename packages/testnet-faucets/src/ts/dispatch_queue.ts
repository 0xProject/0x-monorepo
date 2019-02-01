import { intervalUtils, logUtils } from '@0x/utils';
import * as _ from 'lodash';

import { errorReporter } from './error_reporter';

const MAX_QUEUE_SIZE = 500;
const DEFAULT_QUEUE_INTERVAL_MS = 1000;

export class DispatchQueue {
    private readonly _queueIntervalMs: number;
    private readonly _queue: Array<() => Promise<void>>;
    private _queueIntervalIdIfExists?: NodeJS.Timer;
    constructor() {
        this._queueIntervalMs = DEFAULT_QUEUE_INTERVAL_MS;
        this._queue = [];
        this._start();
    }
    public add(taskAsync: () => Promise<void>): boolean {
        if (this.isFull()) {
            return false;
        }
        this._queue.push(taskAsync);
        return true;
    }
    public size(): number {
        return this._queue.length;
    }
    public isFull(): boolean {
        return this.size() >= MAX_QUEUE_SIZE;
    }
    public stop(): void {
        if (!_.isUndefined(this._queueIntervalIdIfExists)) {
            intervalUtils.clearAsyncExcludingInterval(this._queueIntervalIdIfExists);
        }
    }
    private _start(): void {
        this._queueIntervalIdIfExists = intervalUtils.setAsyncExcludingInterval(
            async () => {
                const taskAsync = this._queue.shift();
                if (_.isUndefined(taskAsync)) {
                    return Promise.resolve();
                }
                await taskAsync();
            },
            this._queueIntervalMs,
            (err: Error) => {
                logUtils.log(`Unexpected err: ${err} - ${JSON.stringify(err)}`);
                // tslint:disable-next-line:no-floating-promises
                errorReporter.reportAsync(err);
            },
        );
    }
}
