// tslint:disable
import { SignedOrder } from '..';
import * as _ from 'lodash';

import { CollapsedFill, DexSample } from './market_operation_utils/types';

export interface AnnotatedRfqtFirmQuote {
    signedOrder: SignedOrder;
    makerUri: string;
}

export class QuoteReporter {
    private readonly _metadataIdentifier: string;
    private _dexSamples: DexSample[];
    private _orderbookOrders: SignedOrder[];
    private _rfqtOrders: AnnotatedRfqtFirmQuote[];

    constructor(metadataIdentifier: string) {
        this._metadataIdentifier = metadataIdentifier;
        this._dexSamples = [];
        this._orderbookOrders = [];
        this._rfqtOrders = [];
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

    public reportQuote(paths: CollapsedFill[]) {
        const sanitizedPaths = paths.map(p => _.omit(p, 'subFills'));
        console.log('dex samples:', JSON.stringify(this._dexSamples, undefined, 2));
        console.log('orderbook orders:', JSON.stringify(this._orderbookOrders, undefined, 2));
        console.log('rfqt orders:', JSON.stringify(this._rfqtOrders, undefined, 2));
        console.log('quote report:', JSON.stringify(sanitizedPaths, undefined, 2));
        return;
    }
}
