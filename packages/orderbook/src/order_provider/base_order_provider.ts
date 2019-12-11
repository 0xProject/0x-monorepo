import { AssetPairsItem, SignedOrder } from '@0x/types';

import { OrderStore } from '../order_store';
import { AcceptedRejectedOrders, AddedRemovedOrders } from '../types';

// AssetPairItem requires precision but some OrderProviders may not
// enforce any precision. This is not the token decimal but the
// maximum precision for an orderbook.
export const DEFAULT_TOKEN_PRECISION = 18;

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

    protected async _updateStoreAsync(addedRemoved: AddedRemovedOrders): Promise<void> {
        await this._orderStore.updateAsync(addedRemoved);
    }
}
