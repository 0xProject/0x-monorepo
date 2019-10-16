import { ContractGetterFunction } from './function_assertions';
import * as _ from 'lodash';

export class GetterCache<TCallArgs extends any[]> {
    // The getter function whose values will be cached.
    public getter: ContractGetterFunction<TCallArgs>;

    // The cache that will be used to store values. This has to use a "string" for indexing
    // because the "Map" datastructure uses reference equality when the keys are objects,
    // which was unsuitable for our purposes.
    private cache: {
        [key: string]: any;
    };

    constructor(getter: ContractGetterFunction<TCallArgs>) {
        this.getter = getter;
        this.cache = {};
    }

    /**
     * Calls the contract getter and caches the result if there is not a cached value. Otherwise,
     * this returns the cached value.
     * @param ...args A variadic list of args to use when calling "callAsync". Due
     *                to the fact that we need to serialize the arguments to "callAsync" these
     *                arguments must be valid arguments to "getABIEncodedTransactionData".
     * @return Either a cached value or the queried value.
     */
    public async callAsync(...args: TCallArgs): Promise<any> {
        const key = this.getter.getABIEncodedTransactionData(...args);
        const cachedResult = this.cache[key];

        if (cachedResult !== undefined) {
            return cachedResult;
        } else {
            const result = await this.getter.callAsync(...args);
            this.cache[key] = result;
            return result;
        }
    }

    /**
     * Flushes the entire cache so that future calls to "callAsync" call the contract getter.
     */
    public flush(): void {
        this.cache = {};
    }
}

export interface GetterCacheSet {
    [getter: string]: GetterCache<any[]>;
}

export class GetterCacheCollection {
    // A dictionary of getter cache's that allow the user of the collection to reference
    // the getter functions by name.
    public getters: GetterCacheSet;

    /**
     * Constructs a getter collection with pre-seeded getter names and getters.
     * @param getterNames The names of the getter functions to register.
     * @param getters The getter functions to register.
     */
    constructor(getters: GetterCacheSet) {
        this.getters = getters;
    }

    /**
     * Registers a new getter in the collection.
     * @param getterName The name of the contract getter function.
     * @param getter The actual contract getter function.
     */
    public registerGetter(getterName: string, getter: ContractGetterFunction<any[]>): void {
        this.getters[getterName] = new GetterCache(getter);
    }

    /**
     * Flushes all of the registered caches.
     */
    public flushAll(): void {
        for (const getter of Object.keys(this.getters)) {
            this.getters[getter].flush();
        }
    }
}
