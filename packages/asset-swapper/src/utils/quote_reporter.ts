import { MarketOperation } from './../types';
// TODO: remove
// tslint:disable
import { SignedOrder, ERC20BridgeSource } from '..';
import * as _ from 'lodash';

import { CollapsedFill, DexSample } from './market_operation_utils/types';
import { BigNumber } from '@0x/utils';
import { QuoteReport, QuoteReportGenerator } from './quote_report_generator';

export interface AnnotatedRfqtFirmQuote {
    signedOrder: SignedOrder;
    makerUri: string;
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

    public getReport(marketOperation: MarketOperation): QuoteReport {
        const generator = new QuoteReportGenerator(this._dexSamples, this._orderbookOrders, this._rfqtOrders, this._paths, marketOperation);
        return generator.generateReport();
    }
}
