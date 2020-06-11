// tslint:disable
import { SignedOrder } from '..';
import * as _ from 'lodash';

import { CollapsedFill, DexSample } from './market_operation_utils/types';

export interface AnnotatedRfqtFirmQuote {
    signedOrder: SignedOrder;
    makerUri: string;
}

export class OrderReporter {
    private readonly _metadataIdentifier: string;
    private _dexSamples: DexSample[];
    private _orderbookSamples: SignedOrder[];
    private _rfqtSamples: AnnotatedRfqtFirmQuote[];

    // todo: take in request opts, like sell or buy and amount
    constructor(metadataIdentifier: string) {
        this._metadataIdentifier = metadataIdentifier;
        this._dexSamples = [];
        this._orderbookSamples = [];
        this._rfqtSamples = [];
    }

    public trackDexSamples(dexSamples: DexSample[]) {
        this._dexSamples = dexSamples;
    }

    public trackOrderbookSamples(orderbookSamples: SignedOrder[]) {
        this._orderbookSamples = orderbookSamples;
    }

    public trackRfqtSamples(rfqtSamples: AnnotatedRfqtFirmQuote[]) {
        this._rfqtSamples = rfqtSamples;
    }

    public reportQuote(paths: CollapsedFill[]) {
        const sanitizedPaths = paths.map(p => _.omit(p, 'subFills'));
        console.log('dex samples:', JSON.stringify(this._dexSamples, undefined, 2));
        console.log('orderbook samples:', JSON.stringify(this._orderbookSamples, undefined, 2));
        console.log('rfqt samples:', JSON.stringify(this._rfqtSamples, undefined, 2));
        console.log('quote report:', JSON.stringify(sanitizedPaths, undefined, 2));
        return;
    }
}
