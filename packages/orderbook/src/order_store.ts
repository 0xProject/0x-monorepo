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
    public getOrderSetForAssets(makerAssetData: string, takerAssetData: string): OrderSet {
        const assetPairKey = OrderStore.getKeyForAssetPair(makerAssetData, takerAssetData);
        return this.getOrderSetForAssetPair(assetPairKey);
    }
    public getOrderSetForAssetPair(assetPairKey: string): OrderSet {
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
        const orders = this.getOrderSetForAssetPair(assetPairKey);
        await orders.addManyAsync(added);
        await orders.deleteManyAsync(removed);
    }
    public has(assetPairKey: string): boolean {
        return this._orders.has(assetPairKey);
    }
    public values(assetPairKey: string): APIOrder[] {
        return Array.from(this.getOrderSetForAssetPair(assetPairKey).values());
    }
    public keys(): IterableIterator<string> {
        return this._orders.keys();
    }
}
