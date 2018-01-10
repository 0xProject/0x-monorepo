import * as _ from 'lodash';
import * as timers from 'timers';

// HACK: web3 leaks XMLHttpRequest into the global scope and causes requests to hang
// because they are using the wrong XHR package.
// Filed issue: https://github.com/ethereum/web3.js/issues/844
// tslint:disable-next-line:ordered-imports
import * as Web3 from 'web3';

const MAX_QUEUE_SIZE = 500;
const DEFAULT_QUEUE_INTERVAL_MS = 1000;

export class RequestQueue {
    protected queueIntervalMs: number;
    protected queue: string[];
    protected queueIntervalId: NodeJS.Timer;
    protected web3: Web3;
    constructor(web3: any) {
        this.queueIntervalMs = DEFAULT_QUEUE_INTERVAL_MS;
        this.queue = [];

        this.web3 = web3;

        this.start();
    }
    public add(recipientAddress: string): boolean {
        if (this.isFull()) {
            return false;
        }
        this.queue.push(recipientAddress);
        return true;
    }
    public size(): number {
        return this.queue.length;
    }
    public isFull(): boolean {
        return this.size() >= MAX_QUEUE_SIZE;
    }
    protected start() {
        this.queueIntervalId = timers.setInterval(() => {
            const recipientAddress = this.queue.shift();
            if (_.isUndefined(recipientAddress)) {
                return;
            }
            // tslint:disable-next-line:no-floating-promises
            this.processNextRequestFireAndForgetAsync(recipientAddress);
        }, this.queueIntervalMs);
    }
    protected stop() {
        clearInterval(this.queueIntervalId);
    }
    // tslint:disable-next-line:prefer-function-over-method
    protected async processNextRequestFireAndForgetAsync(recipientAddress: string) {
        throw new Error('Expected processNextRequestFireAndForgetAsync to be implemented by a superclass');
    }
}
