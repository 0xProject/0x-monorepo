import { BigNumber, intervalUtils } from '@0xproject/utils';
import { RBTree } from 'bintrees';
import * as _ from 'lodash';

import { ZeroExError } from '../types';
import { utils } from '../utils/utils';

const DEFAULT_EXPIRATION_MARGIN_MS = 0;
const DEFAULT_ORDER_EXPIRATION_CHECKING_INTERVAL_MS = 50;

/**
 * This class includes the functionality to detect expired orders.
 * It stores them in a min heap by expiration time and checks for expired ones every `orderExpirationCheckingIntervalMs`
 */
export class ExpirationWatcher {
    private _orderHashByExpirationRBTree: RBTree<string>;
    private _expiration: { [orderHash: string]: BigNumber } = {};
    private _orderExpirationCheckingIntervalMs: number;
    private _expirationMarginMs: number;
    private _orderExpirationCheckingIntervalIdIfExists?: NodeJS.Timer;
    constructor(expirationMarginIfExistsMs?: number, orderExpirationCheckingIntervalIfExistsMs?: number) {
        this._expirationMarginMs = expirationMarginIfExistsMs || DEFAULT_EXPIRATION_MARGIN_MS;
        this._orderExpirationCheckingIntervalMs =
            expirationMarginIfExistsMs || DEFAULT_ORDER_EXPIRATION_CHECKING_INTERVAL_MS;
        const comparator = (lhsOrderHash: string, rhsOrderHash: string) => {
            const lhsExpiration = this._expiration[lhsOrderHash].toNumber();
            const rhsExpiration = this._expiration[rhsOrderHash].toNumber();
            if (lhsExpiration !== rhsExpiration) {
                return lhsExpiration - rhsExpiration;
            } else {
                // HACK: If two orders have identical expirations, the order in which they are emitted by the
                // ExpirationWatcher does not matter, so we emit them in alphabetical order by orderHash.
                return lhsOrderHash.localeCompare(rhsOrderHash);
            }
        };
        this._orderHashByExpirationRBTree = new RBTree(comparator);
    }
    public subscribe(callback: (orderHash: string) => void): void {
        if (!_.isUndefined(this._orderExpirationCheckingIntervalIdIfExists)) {
            throw new Error(ZeroExError.SubscriptionAlreadyPresent);
        }
        this._orderExpirationCheckingIntervalIdIfExists = intervalUtils.setInterval(
            this._pruneExpiredOrders.bind(this, callback),
            this._orderExpirationCheckingIntervalMs,
            _.noop, // _pruneExpiredOrders never throws
        );
    }
    public unsubscribe(): void {
        if (_.isUndefined(this._orderExpirationCheckingIntervalIdIfExists)) {
            throw new Error(ZeroExError.SubscriptionNotFound);
        }
        intervalUtils.clearInterval(this._orderExpirationCheckingIntervalIdIfExists);
        delete this._orderExpirationCheckingIntervalIdIfExists;
    }
    public addOrder(orderHash: string, expirationUnixTimestampMs: BigNumber): void {
        this._expiration[orderHash] = expirationUnixTimestampMs;
        this._orderHashByExpirationRBTree.insert(orderHash);
    }
    public removeOrder(orderHash: string): void {
        if (_.isUndefined(this._expiration[orderHash])) {
            return; // noop since order already removed
        }
        this._orderHashByExpirationRBTree.remove(orderHash);
        delete this._expiration[orderHash];
    }
    private _pruneExpiredOrders(callback: (orderHash: string) => void): void {
        const currentUnixTimestampMs = utils.getCurrentUnixTimestampMs();
        while (true) {
            const hasTrakedOrders = this._orderHashByExpirationRBTree.size === 0;
            if (hasTrakedOrders) {
                break;
            }
            const nextOrderHashToExpire = this._orderHashByExpirationRBTree.min();
            const hasNoExpiredOrders = this._expiration[nextOrderHashToExpire].greaterThan(
                currentUnixTimestampMs.plus(this._expirationMarginMs),
            );
            const isSubscriptionActive = _.isUndefined(this._orderExpirationCheckingIntervalIdIfExists);
            if (hasNoExpiredOrders || isSubscriptionActive) {
                break;
            }
            const orderHash = this._orderHashByExpirationRBTree.min();
            this._orderHashByExpirationRBTree.remove(orderHash);
            delete this._expiration[orderHash];
            callback(orderHash);
        }
    }
}
