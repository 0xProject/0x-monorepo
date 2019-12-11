import { APIOrder } from '@0x/connect';

import { OrderSet } from './order_set';
import { AddedRemovedOrders } from './types';

export class OrderStore {
    // Both bids and asks are stored together in one set
    private readonly _orders: Map<string, OrderSet> = new Map();
    public static getKeyForAssetPair(makerAssetData: string, takerAssetData: string): string {
        return [makerAssetData, takerAssetData].sort().join('-');
    }
    public static assetPairKeyToAssets(assetPairKey: string): string[] {
        return assetPairKey.split('-');
    }
    public async getOrderSetForAssetsAsync(makerAssetData: string, takerAssetData: string): Promise<OrderSet> {
        const assetPairKey = OrderStore.getKeyForAssetPair(makerAssetData, takerAssetData);
        return this.getOrderSetForAssetPairAsync(assetPairKey);
    }
    public async getOrderSetForAssetPairAsync(assetPairKey: string): Promise<OrderSet> {
        const orderSet = this._orders.get(assetPairKey);
        if (!orderSet) {
            const newOrderSet = new OrderSet();
            this._orders.set(assetPairKey, newOrderSet);
            return newOrderSet;
        }
        return orderSet;
    }
    public async updateAsync(addedRemoved: AddedRemovedOrders): Promise<void> {
        const { added, removed, assetPairKey } = addedRemoved;
        const orders = await this.getOrderSetForAssetPairAsync(assetPairKey);
        await orders.addManyAsync(added);
        await orders.deleteManyAsync(removed);
    }
    public async hasAsync(assetPairKey: string): Promise<boolean> {
        return this._orders.has(assetPairKey);
    }
    public async valuesAsync(assetPairKey: string): Promise<APIOrder[]> {
        return Array.from((await this.getOrderSetForAssetPairAsync(assetPairKey)).values());
    }
    public async keysAsync(): Promise<IterableIterator<string>> {
        return this._orders.keys();
    }
}
