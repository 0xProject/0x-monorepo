import { AssetPairsItem, SignedOrder } from '@0x/types';

import { OrderStore } from '../order_store';
import { AcceptedRejectedOrders, AddedRemovedOrders } from '../types';

export abstract class BaseOrderProvider {
    public readonly _orderStore: OrderStore;

    constructor(orderStore: OrderStore) {
        this._orderStore = orderStore;
    }

    public abstract async createSubscriptionForAssetPairAsync(
        makerAssetData: string,
        takerAssetData: string,
    ): Promise<void>;

    public abstract async getAvailableAssetDatasAsync(): Promise<AssetPairsItem[]>;

    public abstract async destroyAsync(): Promise<void>;

    public abstract async addOrdersAsync(orders: SignedOrder[]): Promise<AcceptedRejectedOrders>;

    protected _updateStore(addedRemoved: AddedRemovedOrders): void {
        const orderSet = this._orderStore.getOrderSetForAssetPair(addedRemoved.assetPairKey);
        orderSet.addMany(addedRemoved.added);
        orderSet.deleteMany(addedRemoved.removed);
    }
}
