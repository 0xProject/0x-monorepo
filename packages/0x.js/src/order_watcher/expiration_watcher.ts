import * as _ from 'lodash';
import {BigNumber} from 'bignumber.js';
import {RBTree} from 'bintrees';
import {utils} from '../utils/utils';
import {intervalUtils} from '../utils/interval_utils';
import {SignedOrder, ZeroExError} from '../types';
import {ZeroEx} from '../0x';

const DEFAULT_EXPIRATION_MARGIN_MS = 0;
const DEFAULT_ORDER_EXPIRATION_CHECKING_INTERVAL_MS = 50;

/**
 * This class includes the functionality to detect expired orders.
 * It stores them in a min heap by expiration time and checks for expired ones every `orderExpirationCheckingIntervalMs`
 */
export class ExpirationWatcher {
    private orderHashRBTreeByExpiration: RBTree<string>;
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
        const comparator = (lhs: string, rhs: string) => scoreFunction(lhs) - scoreFunction(rhs);
        this.orderHashRBTreeByExpiration = new RBTree(comparator);
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
        this.orderHashRBTreeByExpiration.insert(orderHash);
    }
    public removeOrder(orderHash: string): void {
        this.orderHashRBTreeByExpiration.remove(orderHash);
        delete this.expiration[orderHash];
    }
    private pruneExpiredOrders(): void {
        const currentUnixTimestampMs = utils.getCurrentUnixTimestampMs();
        while (
            this.orderHashRBTreeByExpiration.size !== 0 &&
            this.expiration[this.orderHashRBTreeByExpiration.min()].lessThan(
                currentUnixTimestampMs.plus(this.expirationMarginMs),
            ) &&
            !_.isUndefined(this.callbackIfExists)
        ) {
            const orderHash = this.orderHashRBTreeByExpiration.min();
            this.orderHashRBTreeByExpiration.remove(orderHash);
            delete this.expiration[orderHash];
            this.callbackIfExists(orderHash);
        }
    }
}
