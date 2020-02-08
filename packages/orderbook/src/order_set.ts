import { APIOrder } from '@0x/connect';

import { utils } from './utils';

export class OrderSet {
    private readonly _map: Map<string, APIOrder>;
    constructor() {
        this._map = new Map();
        (this as any)[Symbol.iterator] = this.values;
    }

    public size(): number {
        return this._map.size;
    }

    public async addAsync(item: APIOrder): Promise<void> {
        const orderHash = utils.getOrderHash(item);
        (item.metaData as any).orderHash = orderHash;
        this._map.set(orderHash, item);
    }

    public async addManyAsync(items: APIOrder[]): Promise<void> {
        for (const item of items) {
            await this.addAsync(item);
        }
    }

    public async hasAsync(order: APIOrder): Promise<boolean> {
        return this._map.has(utils.getOrderHash(order));
    }

    public async diffAsync(other: OrderSet): Promise<{ added: APIOrder[]; removed: APIOrder[] }> {
        const added: APIOrder[] = [];
        const removed: APIOrder[] = [];
        for (const otherItem of other.values()) {
            const doesContainItem = this._map.has(utils.getOrderHash(otherItem));
            if (!doesContainItem) {
                added.push(otherItem);
            }
        }
        for (const item of this.values()) {
            const doesContainItem = other._map.has(utils.getOrderHash(item));
            if (!doesContainItem) {
                removed.push(item);
            }
        }
        return { added, removed };
    }

    public values(): IterableIterator<APIOrder> {
        return this._map.values();
    }

    public async deleteAsync(item: APIOrder): Promise<boolean> {
        return this._map.delete(utils.getOrderHash(item));
    }

    public async deleteManyAsync(items: APIOrder[]): Promise<void> {
        for (const item of items) {
            await this.deleteAsync(item);
        }
    }
}
