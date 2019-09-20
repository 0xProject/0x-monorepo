import { APIOrder } from '@0x/connect';

import { utils } from './utils';

export class OrderSet {
    private readonly _map: Map<string, APIOrder>;
    constructor(orders: APIOrder[] = []) {
        this._map = new Map();
        (this as any)[Symbol.iterator] = this.values;
        for (const order of orders) {
            this.add(order);
        }
    }

    public size(): number {
        return this._map.size;
    }

    public add(item: APIOrder): void {
        const orderHash = utils.getOrderHash(item);
        (item.metaData as any).orderHash = orderHash;
        this._map.set(orderHash, item);
    }

    public addMany(items: APIOrder[]): void {
        for (const item of items) {
            this.add(item);
        }
    }

    public has(order: APIOrder): boolean {
        return this._map.has(utils.getOrderHash(order));
    }

    public diff(other: OrderSet): { added: APIOrder[]; removed: APIOrder[] } {
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

    public delete(item: APIOrder): boolean {
        return this._map.delete(utils.getOrderHash(item));
    }

    public deleteMany(items: APIOrder[]): void {
        for (const item of items) {
            this.delete(item);
        }
    }
}
