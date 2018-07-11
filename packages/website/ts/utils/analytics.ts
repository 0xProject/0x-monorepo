import * as _ from 'lodash';
import { ObjectMap, Order } from 'ts/types';
import { utils } from 'ts/utils/utils';

export interface HeapAnalytics {
    loaded: boolean;
    indentify(id: string, idType: string): void;
    track(eventName: string, eventProperties?: ObjectMap<string | number>): void;
    resetIdentity(): void;
    addUserProperties(properties: ObjectMap<string | number>): void;
    addEventProperties(properties: ObjectMap<string | number>): void;
    removeEventProperty(property: string): void;
    clearEventProperties(): void;
}

export class Analytics {
    private _heap: HeapAnalytics;
    public static init(): Analytics {
        return new Analytics(Analytics.getHeap());
    }
    public static getHeap(): HeapAnalytics {
        const heap = (window as any).heap;
        if (!_.isUndefined(heap)) {
            return heap;
        } else {
            throw new Error('Could not find the Heap SDK on the page.');
        }
    }
    constructor(heap: HeapAnalytics) {
        this._heap = heap;
    }
    // HeapAnalytics Wrappers
    public async indentifyAsync(id: string, idType: string): Promise<void> {
        await this._heapLoadedGuardAsync();
        this._heap.indentify(id, idType);
    }
    public async trackAsync(eventName: string, eventProperties?: ObjectMap<string | number>): Promise<void> {
        await this._heapLoadedGuardAsync();
        this._heap.track(eventName, eventProperties);
    }
    public async resetIdentityAsync(): Promise<void> {
        await this._heapLoadedGuardAsync();
        this._heap.resetIdentity();
    }
    public async addUserPropertiesAsync(properties: ObjectMap<string | number>): Promise<void> {
        await this._heapLoadedGuardAsync();
        this._heap.addUserProperties(properties);
    }
    public async addEventPropertiesAsync(properties: ObjectMap<string | number>): Promise<void> {
        await this._heapLoadedGuardAsync();
        this._heap.addEventProperties(properties);
    }
    public async removeEventPropertyAsync(property: string): Promise<void> {
        await this._heapLoadedGuardAsync();
        this._heap.removeEventProperty(property);
    }
    public async clearEventPropertiesAsync(): Promise<void> {
        await this._heapLoadedGuardAsync();
        this._heap.clearEventProperties();
    }
    // Custom methods
    public async trackOrderEventAsync(eventName: string, order: Order): Promise<void> {
        const orderLoggingData = {
            takerTokenAmount: order.signedOrder.takerTokenAmount,
            makeTokenAmount: order.signedOrder.makerTokenAmount,
            takerToken: order.metadata.takerToken.symbol,
            makerToken: order.metadata.makerToken.symbol,
        };
        this.trackAsync(eventName, orderLoggingData);
    }
    /**
     * Heap is not available as a UMD module, and additionally has the strange property of replacing itself with
     * a different object once it's loaded.
     * Instead of having an await call before every analytics use, we opt to have the awaiting logic in here by
     * guarding every API call with the guard below.
     */
    private async _heapLoadedGuardAsync(): Promise<void> {
        if (this._heap.loaded) {
            return undefined;
        }
        await utils.onPageLoadPromise;
        // HACK: Reset heap to loaded heap
        this._heap = (window as any).heap;
    }
}

export const analytics = Analytics.init();
