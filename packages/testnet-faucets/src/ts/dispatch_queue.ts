import { intervalUtils } from '@0xproject/utils';
import * as _ from 'lodash';

const MAX_QUEUE_SIZE = 500;
const DEFAULT_QUEUE_INTERVAL_MS = 1000;

export class DispatchQueue {
    private _queueIntervalMs: number;
    private _queue: Array<() => Promise<void>>;
    private _queueIntervalIdIfExists?: NodeJS.Timer;
    constructor() {
        this._queueIntervalMs = DEFAULT_QUEUE_INTERVAL_MS;
        this._queue = [];
        this._start();
    }
    public add(task: () => Promise<void>): boolean {
        if (this.isFull()) {
            return false;
        }
        this._queue.push(task);
        return true;
    }
    public size(): number {
        return this._queue.length;
    }
    public isFull(): boolean {
        return this.size() >= MAX_QUEUE_SIZE;
    }
    public stop() {
        if (!_.isUndefined(this._queueIntervalIdIfExists)) {
            intervalUtils.clearAsyncExcludingInterval(this._queueIntervalIdIfExists);
        }
    }
    private _start() {
        this._queueIntervalIdIfExists = intervalUtils.setAsyncExcludingInterval(
            async () => {
                const task = this._queue.shift();
                if (_.isUndefined(task)) {
                    return Promise.resolve();
                }
                await task();
            },
            this._queueIntervalMs,
            _.noop,
        );
    }
}
