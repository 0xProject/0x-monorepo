// tslint:disable
import { SignedOrder } from '..';
import * as _ from 'lodash';

import { CollapsedFill, DexSample } from './market_operation_utils/types';

export interface AnnotatedRfqtFirmQuote {
    signedOrder: SignedOrder;
    makerUri: string;
}

export interface QuoteReport {
    dexSamples: DexSample[];
    orderbookOrders: SignedOrder[];
    rfqtOrders: AnnotatedRfqtFirmQuote[];
    paths: CollapsedFill[];
}

export class QuoteReporter {
    private _dexSamples: DexSample[];
    private _orderbookOrders: SignedOrder[];
    private _rfqtOrders: AnnotatedRfqtFirmQuote[];
    private _paths: CollapsedFill[];

    constructor() {
        this._dexSamples = [];
        this._orderbookOrders = [];
        this._rfqtOrders = [];
        this._paths = [];
    }

    public trackDexSamples(dexSamples: DexSample[]) {
        this._dexSamples = dexSamples;
    }

    public trackOrderbookOrders(_orderbookOrders: SignedOrder[]) {
        this._orderbookOrders = _orderbookOrders;
    }

    public trackRfqtOrders(rfqtOrders: AnnotatedRfqtFirmQuote[]) {
        this._rfqtOrders = rfqtOrders;
    }

    public trackPaths(paths: CollapsedFill[]) {
        this._paths = paths;
    }

    public getReport(): QuoteReport {
        return {
            dexSamples: this._dexSamples,
            orderbookOrders: this._orderbookOrders,
            rfqtOrders: this._rfqtOrders,
            paths: this._paths,
        }
    }
}
