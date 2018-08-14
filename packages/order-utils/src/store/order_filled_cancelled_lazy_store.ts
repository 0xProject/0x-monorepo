import { BigNumber } from '@0xproject/utils';
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
    constructor(orderFilledCancelledFetcher: AbstractOrderFilledCancelledFetcher) {
        this._orderFilledCancelledFetcher = orderFilledCancelledFetcher;
        this._filledTakerAmount = {};
        this._isCancelled = {};
    }
    public async getFilledTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        if (_.isUndefined(this._filledTakerAmount[orderHash])) {
            const filledTakerAmount = await this._orderFilledCancelledFetcher.getFilledTakerAmountAsync(orderHash);
            this.setFilledTakerAmount(orderHash, filledTakerAmount);
        }
        const cachedFilledTakerAmount = this._filledTakerAmount[orderHash];
        return cachedFilledTakerAmount;
    }
    public setFilledTakerAmount(orderHash: string, filledTakerAmount: BigNumber): void {
        this._filledTakerAmount[orderHash] = filledTakerAmount;
    }
    public deleteFilledTakerAmount(orderHash: string): void {
        delete this._filledTakerAmount[orderHash];
    }
    public async getIsCancelledAsync(orderHash: string): Promise<boolean> {
        if (_.isUndefined(this._isCancelled[orderHash])) {
            const isCancelled = await this._orderFilledCancelledFetcher.isOrderCancelledAsync(orderHash);
            this.setIsCancelled(orderHash, isCancelled);
        }
        const cachedIsCancelled = this._isCancelled[orderHash]; // tslint:disable-line:boolean-naming
        return cachedIsCancelled;
    }
    public setIsCancelled(orderHash: string, isCancelled: boolean): void {
        this._isCancelled[orderHash] = isCancelled;
    }
    public deleteIsCancelled(orderHash: string): void {
        delete this._isCancelled[orderHash];
    }
    public deleteAll(): void {
        this.deleteAllFilled();
        this.deleteAllIsCancelled();
    }
    public deleteAllIsCancelled(): void {
        this._isCancelled = {};
    }
    public deleteAllFilled(): void {
        this._filledTakerAmount = {};
    }
    public getZRXAssetData(): string {
        const zrxAssetData = this._orderFilledCancelledFetcher.getZRXAssetData();
        return zrxAssetData;
    }
}
