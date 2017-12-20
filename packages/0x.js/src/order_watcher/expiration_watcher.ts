import {intervalUtils} from '@0xproject/utils';
import {BigNumber} from 'bignumber.js';
import {RBTree} from 'bintrees';
import * as _ from 'lodash';

import {ZeroExError} from '../types';
import {utils} from '../utils/utils';

const DEFAULT_EXPIRATION_MARGIN_MS = 0;
const DEFAULT_ORDER_EXPIRATION_CHECKING_INTERVAL_MS = 50;

/**
 * This class includes the functionality to detect expired orders.
 * It stores them in a min heap by expiration time and checks for expired ones every `orderExpirationCheckingIntervalMs`
 */
export class ExpirationWatcher {
    private orderHashByExpirationRBTree: RBTree<string>;
    private expiration: {[orderHash: string]: BigNumber} = {};
    private orderExpirationCheckingIntervalMs: number;
    private expirationMarginMs: number;
    private orderExpirationCheckingIntervalIdIfExists?: NodeJS.Timer;
    constructor(expirationMarginIfExistsMs?: number,
                orderExpirationCheckingIntervalIfExistsMs?: number) {
        this.expirationMarginMs = expirationMarginIfExistsMs ||
                                  DEFAULT_EXPIRATION_MARGIN_MS;
        this.orderExpirationCheckingIntervalMs = expirationMarginIfExistsMs ||
                                                 DEFAULT_ORDER_EXPIRATION_CHECKING_INTERVAL_MS;
        const scoreFunction = (orderHash: string) => this.expiration[orderHash].toNumber();
        const comparator = (lhs: string, rhs: string) => scoreFunction(lhs) - scoreFunction(rhs);
        this.orderHashByExpirationRBTree = new RBTree(comparator);
    }
    public subscribe(callback: (orderHash: string) => void): void {
        if (!_.isUndefined(this.orderExpirationCheckingIntervalIdIfExists)) {
            throw new Error(ZeroExError.SubscriptionAlreadyPresent);
        }
        this.orderExpirationCheckingIntervalIdIfExists = intervalUtils.setAsyncExcludingInterval(
            this.pruneExpiredOrders.bind(this, callback), this.orderExpirationCheckingIntervalMs,
        );
    }
    public unsubscribe(): void {
        if (_.isUndefined(this.orderExpirationCheckingIntervalIdIfExists)) {
            throw new Error(ZeroExError.SubscriptionNotFound);
        }
        intervalUtils.clearAsyncExcludingInterval(this.orderExpirationCheckingIntervalIdIfExists);
        delete this.orderExpirationCheckingIntervalIdIfExists;
    }
    public addOrder(orderHash: string, expirationUnixTimestampMs: BigNumber): void {
        this.expiration[orderHash] = expirationUnixTimestampMs;
        this.orderHashByExpirationRBTree.insert(orderHash);
    }
    public removeOrder(orderHash: string): void {
        this.orderHashByExpirationRBTree.remove(orderHash);
        delete this.expiration[orderHash];
    }
    private pruneExpiredOrders(callback: (orderHash: string) => void): void {
        const currentUnixTimestampMs = utils.getCurrentUnixTimestampMs();
        while (true) {
            const hasTrakedOrders = this.orderHashByExpirationRBTree.size === 0;
            if (hasTrakedOrders) {
                break;
            }
            const nextOrderHashToExpire = this.orderHashByExpirationRBTree.min();
            const hasNoExpiredOrders = this.expiration[nextOrderHashToExpire].greaterThan(
                currentUnixTimestampMs.plus(this.expirationMarginMs),
            );
            const isSubscriptionActive = _.isUndefined(this.orderExpirationCheckingIntervalIdIfExists);
            if (hasNoExpiredOrders || isSubscriptionActive) {
                break;
            }
            const orderHash = this.orderHashByExpirationRBTree.min();
            this.orderHashByExpirationRBTree.remove(orderHash);
            delete this.expiration[orderHash];
            callback(orderHash);
        }
    }
}
