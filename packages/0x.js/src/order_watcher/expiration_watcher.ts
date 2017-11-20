import * as _ from 'lodash';
import {BigNumber} from 'bignumber.js';
import {utils} from '../utils/utils';
import {intervalUtils} from '../utils/interval_utils';
import {SignedOrder, ZeroExError} from '../types';
import {Heap} from '../utils/heap';
import {ZeroEx} from '../0x';

const DEFAULT_EXPIRATION_MARGIN_MS = 0;
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
    private expirationMarginMs: number;
    private orderExpirationCheckingIntervalIdIfExists?: NodeJS.Timer;
    constructor(expirationMarginIfExistsMs?: number,
                orderExpirationCheckingIntervalIfExistsMs?: number) {
        this.expirationMarginMs = expirationMarginIfExistsMs ||
                                  DEFAULT_ORDER_EXPIRATION_CHECKING_INTERVAL_MS;
        this.orderExpirationCheckingIntervalMs = expirationMarginIfExistsMs ||
                                                 DEFAULT_ORDER_EXPIRATION_CHECKING_INTERVAL_MS;
        const scoreFunction = (orderHash: string) => this.expiration[orderHash].toNumber();
        this.orderHashHeapByExpiration = new Heap(scoreFunction);
    }
    public subscribe(callback: (orderHash: string) => void): void {
        if (!_.isUndefined(this.callbackIfExists)) {
            throw new Error(ZeroExError.SubscriptionAlreadyPresent);
        }
        this.callbackIfExists = callback;
        this.orderExpirationCheckingIntervalIdIfExists = intervalUtils.setAsyncExcludingInterval(
            this.pruneExpiredOrders.bind(this), this.orderExpirationCheckingIntervalMs,
        );
    }
    public unsubscribe(): void {
        if (_.isUndefined(this.orderExpirationCheckingIntervalIdIfExists)) {
            throw new Error(ZeroExError.SubscriptionNotFound);
        }
        intervalUtils.clearAsyncExcludingInterval(this.orderExpirationCheckingIntervalIdIfExists);
        delete this.callbackIfExists;
        delete this.orderExpirationCheckingIntervalIdIfExists;
    }
    public addOrder(orderHash: string, expirationUnixTimestampMs: BigNumber): void {
        this.expiration[orderHash] = expirationUnixTimestampMs;
        // We don't remove hashes from the heap on order remove because it's slow (linear).
        // We just skip them later if the order was already removed from the order watcher.
        this.orderHashHeapByExpiration.push(orderHash);
    }
    private pruneExpiredOrders(): void {
        const currentUnixTimestampMs = utils.getCurrentUnixTimestampMs();
        while (
            this.orderHashHeapByExpiration.size() !== 0 &&
            this.expiration[this.orderHashHeapByExpiration.head()].lessThan(
                currentUnixTimestampMs.plus(this.expirationMarginMs),
            ) &&
            !_.isUndefined(this.callbackIfExists)
        ) {
            const orderHash = this.orderHashHeapByExpiration.pop();
            delete this.expiration[orderHash];
            this.callbackIfExists(orderHash);
        }
    }
}
