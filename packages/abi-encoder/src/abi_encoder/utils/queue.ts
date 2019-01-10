export class Queue<T> {
    private _store: T[] = [];

    public pushBack(val: T): void {
        this._store.push(val);
    }

    public pushFront(val: T): void {
        this._store.unshift(val);
    }

    public popFront(): T | undefined {
        return this._store.shift();
    }

    public popBack(): T | undefined {
        if (this._store.length === 0) {
            return undefined;
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
