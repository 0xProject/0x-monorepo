import * as _ from 'lodash';
import { InjectedWeb3, ObjectMap, Order } from 'ts/types';
import { configs } from 'ts/utils/configs';
import { utils } from 'ts/utils/utils';

export interface HeapAnalytics {
    indentify(id: string, idType: string): void;
    track(eventName: string, eventProperties?: ObjectMap<string | number>): void;
    resetIdentity(): void;
    addUserProperties(properties: ObjectMap<string | number>): void;
    addEventProperties(properties: ObjectMap<string | number>): void;
    removeEventProperty(property: string): void;
    clearEventProperties(): void;
}

export class Analytics implements HeapAnalytics {
    private _heap: HeapAnalytics;
    public static init(): Analytics {
        const heap = (window as any).heap;
        if (!_.isUndefined(heap)) {
            return new Analytics(heap);
        } else {
            throw new Error('Could not find the Heap SDK on the page.');
        }
    }
    constructor(heap: HeapAnalytics) {
        this._heap = heap;
    }
    // HeapAnalytics Wrappers
    public indentify(id: string, idType: string): void {
        this._heap.indentify(id, idType);
    }
    public track(eventName: string, eventProperties?: ObjectMap<string | number>): void {
        this._heap.track(eventName, eventProperties);
    }
    public resetIdentity(): void {
        this._heap.resetIdentity();
    }
    public addUserProperties(properties: ObjectMap<string | number>): void {
        this._heap.addUserProperties(properties);
    }
    public addEventProperties(properties: ObjectMap<string | number>): void {
        this._heap.addEventProperties(properties);
    }
    public removeEventProperty(property: string): void {
        this._heap.removeEventProperty(property);
    }
    public clearEventProperties(): void {
        this._heap.clearEventProperties();
    }
    // Custom methods
    public trackOrderEvent(eventName: string, order: Order): void {
        const orderLoggingData = {
            takerTokenAmount: order.signedOrder.takerTokenAmount,
            makeTokenAmount: order.signedOrder.makerTokenAmount,
            takerToken: order.metadata.takerToken.symbol,
            makerToken: order.metadata.makerToken.symbol,
        };
        this.track(eventName, orderLoggingData);
    }
    public async logProviderAsync(web3IfExists: InjectedWeb3): Promise<void> {
        await utils.onPageLoadAsync();
        const providerType =
            !_.isUndefined(web3IfExists) && !_.isUndefined(web3IfExists.currentProvider)
                ? utils.getProviderType(web3IfExists.currentProvider)
                : 'NONE';
    }
}

// Assume heap library has loaded.
export const analytics = Analytics.init();
