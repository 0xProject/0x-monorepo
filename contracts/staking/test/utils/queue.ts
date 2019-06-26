import * as _ from 'lodash';

export class Queue<T> {
    private _store: T[] = [];
    constructor (store?: T[]) {
        this._store = store !== undefined ? _.cloneDeep(store) : [];
    }
    public pushBack(val: T): void {
        this._store.push(val);
    }
    public pushFront(val: T): void {
        this._store.unshift(val);
    }
    public popFront(): T {
        if (this._store.length === 0) {
            throw new Error('Queue is empty');
        }
        return this._store.shift() as T;
    }
    public popBack(): T {
        if (this._store.length === 0) {
            throw new Error('Queue is empty');
        }
        const backElement = this._store.splice(-1, 1)[0];
        return backElement;
    }
    public mergeBack(q: Queue<T>): void {
        this._store = this._store.concat(q._store);
    }
    public mergeFront(q: Queue<T>): void {
        this._store = q._store.concat(this._store);
    }
    public getStore(): T[] {
        return this._store;
    }
    public peekFront(): T | undefined {
        return this._store.length >= 0 ? this._store[0] : undefined;
    }
}
