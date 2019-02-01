import { assetDataUtils } from '@0x/order-utils';
import { ObjectMap } from '@0x/types';
import * as _ from 'lodash';
import { PortalOrder } from 'ts/types';
import { utils } from 'ts/utils/utils';

export interface HeapAnalytics {
    loaded: boolean;
    identify(id: string, idType: string): void;
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
    // tslint:disable:no-floating-promises
    // HeapAnalytics Wrappers
    public identify(id: string, idType: string): void {
        this._heapLoadedGuardAsync(() => this._heap.identify(id, idType));
    }
    public track(eventName: string, eventProperties?: ObjectMap<string | number>): void {
        this._heapLoadedGuardAsync(() => this._heap.track(eventName, eventProperties));
    }
    public resetIdentity(): void {
        this._heapLoadedGuardAsync(() => this._heap.resetIdentity());
    }
    public addUserProperties(properties: ObjectMap<string | number>): void {
        this._heapLoadedGuardAsync(() => this._heap.addUserProperties(properties));
    }
    public addEventProperties(properties: ObjectMap<string | number>): void {
        this._heapLoadedGuardAsync(() => this._heap.addEventProperties(properties));
    }
    public removeEventProperty(property: string): void {
        this._heapLoadedGuardAsync(() => this._heap.removeEventProperty(property));
    }
    public clearEventProperties(): void {
        this._heapLoadedGuardAsync(() => this._heap.clearEventProperties());
    }
    // tslint:enable:no-floating-promises
    // Custom methods
    public trackOrderEvent(eventName: string, order: PortalOrder): void {
        const takerTokenAmount = order.signedOrder.takerAssetAmount.toString();
        const makerTokenAmount = order.signedOrder.makerAssetAmount.toString();
        const takerToken = assetDataUtils.decodeERC20AssetData(order.signedOrder.takerAssetData).tokenAddress;
        const makerToken = assetDataUtils.decodeERC20AssetData(order.signedOrder.makerAssetData).tokenAddress;
        const orderLoggingData = {
            takerTokenAmount,
            makerTokenAmount,
            takerToken,
            makerToken,
        };
        this.track(eventName, orderLoggingData);
    }
    /**
     * Heap is not available as a UMD module, and additionally has the strange property of replacing itself with
     * a different object once it's loaded.
     * Instead of having an await call before every analytics use, we opt to have the awaiting logic in here by
     * guarding every API call with the guard below.
     */
    private async _heapLoadedGuardAsync(callback: () => void): Promise<void> {
        if (this._heap.loaded) {
            callback();
            return undefined;
        }
        await utils.onPageLoadPromise;
        // HACK: Reset heap to loaded heap
        this._heap = (window as any).heap;
        callback();
    }
}

export const analytics = Analytics.init();
