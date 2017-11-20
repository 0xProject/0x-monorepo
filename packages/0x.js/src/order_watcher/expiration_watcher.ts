import * as _ from 'lodash';
import {BigNumber} from 'bignumber.js';
import {utils} from '../utils/utils';
import {intervalUtils} from '../utils/interval_utils';
import {SignedOrder} from '../types';
import {Heap} from '../utils/heap';
import {ZeroEx} from '../0x';

// Order prunning is very fast
const DEFAULT_ORDER_EXPIRATION_CHECKING_INTERVAL_MS = 50;

/**
 * This class includes the functionality to detect expired orders.
 * It stores them in a min heap by expiration time and checks for expired ones every `orderExpirationCheckingIntervalMs`
 */
export class ExpirationWatcher {
    private orderHashHeapByExpiration: Heap<string>;
    private expiration: {[orderHash: string]: BigNumber} = {};
    private callbackIfExists?: (orderHash: string) => void;
    private orderExpirationCheckingIntervalMs: number;
    private orderExpirationCheckingIntervalIdIfExists?: NodeJS.Timer;
    constructor(orderExpirationCheckingIntervalMs?: number) {
        this.orderExpirationCheckingIntervalMs = orderExpirationCheckingIntervalMs ||
                                                 DEFAULT_ORDER_EXPIRATION_CHECKING_INTERVAL_MS;
        const scoreFunction = (orderHash: string) => this.expiration[orderHash].toNumber();
        this.orderHashHeapByExpiration = new Heap(scoreFunction);
    }
    public subscribe(callback: (orderHash: string) => void): void {
        this.callbackIfExists = callback;
        this.orderExpirationCheckingIntervalIdIfExists = intervalUtils.setAsyncExcludingInterval(
            this.pruneExpiredOrders.bind(this), this.orderExpirationCheckingIntervalMs,
        );
    }
    public unsubscribe(): void {
        intervalUtils.clearAsyncExcludingInterval(this.orderExpirationCheckingIntervalIdIfExists as NodeJS.Timer);
        delete this.callbackIfExists;
    }
    public addOrder(orderHash: string, expirationUnixTimestampSec: BigNumber): void {
        this.expiration[orderHash] = expirationUnixTimestampSec;
        // We don't remove hashes on order remove because it's slow (linear).
        // We just skip them later if the order was already removed from the order watcher.
        this.orderHashHeapByExpiration.push(orderHash);
    }
    private pruneExpiredOrders(): void {
        const currentUnixTimestampSec = utils.getCurrentUnixTimestamp();
        while (
            this.orderHashHeapByExpiration.size() !== 0 &&
            this.expiration[this.orderHashHeapByExpiration.head()].lessThan(currentUnixTimestampSec) &&
            !_.isUndefined(this.callbackIfExists)
        ) {
            const orderHash = this.orderHashHeapByExpiration.pop();
            delete this.expiration[orderHash];
            this.callbackIfExists(orderHash);
        }
    }
}
