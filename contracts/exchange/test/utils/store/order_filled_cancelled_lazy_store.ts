import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { AbstractOrderFilledCancelledFetcher } from '../abstract/abstract_order_filled_cancelled_fetcher';
import { AbstractOrderFilledCancelledLazyStore } from '../abstract/abstract_order_filled_cancelled_lazy_store';

/**
 * Copy on read store for balances/proxyAllowances of tokens/accounts
 */
export class OrderFilledCancelledLazyStore implements AbstractOrderFilledCancelledLazyStore {
    private readonly _orderFilledCancelledFetcher: AbstractOrderFilledCancelledFetcher;
    private _filledTakerAmount: {
        [orderHash: string]: BigNumber;
    };
    private _isCancelled: {
        [orderHash: string]: boolean;
    };
    /**
     * Instantiate a OrderFilledCancelledLazyStore
     * @param orderFilledCancelledFetcher Class instance that implements the AbstractOrderFilledCancelledFetcher
     * @returns An instance of OrderFilledCancelledLazyStore
     */
    constructor(orderFilledCancelledFetcher: AbstractOrderFilledCancelledFetcher) {
        this._orderFilledCancelledFetcher = orderFilledCancelledFetcher;
        this._filledTakerAmount = {};
        this._isCancelled = {};
    }
    /**
     * Get the filledTakerAssetAmount of an order
     * @param orderHash OrderHash from order of interest
     * @return filledTakerAssetAmount
     */
    public async getFilledTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        if (this._filledTakerAmount[orderHash] === undefined) {
            const filledTakerAmount = await this._orderFilledCancelledFetcher.getFilledTakerAmountAsync(orderHash);
            this.setFilledTakerAmount(orderHash, filledTakerAmount);
        }
        const cachedFilledTakerAmount = this._filledTakerAmount[orderHash];
        return cachedFilledTakerAmount;
    }
    /**
     * Set the filledTakerAssetAmount of an order
     * @param orderHash OrderHash from order of interest
     * @param filledTakerAmount Desired filledTakerAssetAmount
     */
    public setFilledTakerAmount(orderHash: string, filledTakerAmount: BigNumber): void {
        this._filledTakerAmount[orderHash] = filledTakerAmount;
    }
    /**
     * Clear the filledTakerAssetAmount of an order
     * @param orderHash OrderHash from order of interest
     */
    public deleteFilledTakerAmount(orderHash: string): void {
        delete this._filledTakerAmount[orderHash];
    }
    /**
     * Set whether an order has been cancelled or not
     * @param orderHash OrderHash from order of interest
     * @param isCancelled Whether this order should be cancelled or not
     */
    public setIsCancelled(orderHash: string, isCancelled: boolean): void {
        this._isCancelled[orderHash] = isCancelled;
    }
    /**
     * Clear whether the order has been cancelled if already set
     * @param orderHash OrderHash from order of interest
     */
    public deleteIsCancelled(orderHash: string): void {
        delete this._isCancelled[orderHash];
    }
    /**
     * Clear all filled/cancelled state
     */
    public deleteAll(): void {
        this.deleteAllFilled();
        this.deleteAllIsCancelled();
    }
    /**
     * Clear all cancelled state
     */
    public deleteAllIsCancelled(): void {
        this._isCancelled = {};
    }
    /**
     * Clear all filled state
     */
    public deleteAllFilled(): void {
        this._filledTakerAmount = {};
    }
}
