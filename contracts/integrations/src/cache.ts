import { ContractGetterFunction } from './';
import * as _ from 'lodash';

export interface Cache {
    getter: ContractGetterFunction;
    callAsync: (...args: any[]) => Promise<any>;
    flush: () => void;
}

export class GetterCache {
    // The getter function whose values will be cached.
    public getter: ContractGetterFunction;

    // The cache that will be used to store values. This has to use a "string" for indexing
    // because the "Map" datastructure uses reference equality when the keys are objects,
    // which was unsuitable for our purposes.
    private cache: {
        [key: string]: any;
    };

    constructor(getter: ContractGetterFunction) {
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
    public async callAsync(...args: any[]): Promise<any> {
        const cachedResult = this.cache[this.getter.getABIEncodedTransactionData(...args)];

        if (cachedResult !== undefined) {
            return cachedResult;
        } else {
            const result = await this.getter.callAsync(...args);
            this.cache[this.getter.getABIEncodedTransactionData(...args)] = result;
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

export class GetterCacheCollection {
    // A dictionary of getter cache's that allow the user of the collection to reference
    // the getter functions by name.
    public getters: {
        [getter: string]: GetterCache;
    };

    /**
     * Constructs a getter collection with pre-seeded getter names and getters.
     * @param getterNames The names of the getter functions to register.
     * @param getters The getter functions to register.
     */
    constructor(getterNames: string[], getters: ContractGetterFunction[]) {
        if (getterNames.length !== getters.length) {
            throw new Error('Mismatched getter names and getters');
        }

        // Register all of the getters.
        this.getters = {};
        for (const getter of _.zip(getterNames, getters)) {
            this.registerGetter(getter[0] as string, getter[1] as ContractGetterFunction);
        }
    }

    /**
     * Registers a new getter in the collection.
     * @param getterName The name of the contract getter function.
     * @param getter The actual contract getter function.
     */
    public registerGetter(getterName: string, getter: ContractGetterFunction): void {
        this.getters[getterName] = new GetterCache(getter);
    }
}
