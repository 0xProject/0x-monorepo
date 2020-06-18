import { NativeCollapsedFill } from './market_operation_utils/types';
// TODO: remove
// tslint:disable
import { SignedOrder, ERC20BridgeSource } from '..';
import * as _ from 'lodash';

import { CollapsedFill, DexSample } from './market_operation_utils/types';
import { AnnotatedRfqtFirmQuote } from './quote_reporter';
import { MarketOperation } from '../types';
import { BigNumber } from '@0x/utils';

interface ReportSourceBase {
    makerAmount: BigNumber;
    takerAmount: BigNumber;
}
// TODO: use this in QuoteReporter
enum NativeOrderSource {
    Rfqt = 'Rfqt',
    Orderbook = 'Orderbook'
}

interface BridgeReportSource extends ReportSourceBase {
    liquiditySource: ERC20BridgeSource;
}
interface OrderbookReportSource extends ReportSourceBase {
    liquiditySource: NativeOrderSource.Orderbook;
    nativeOrder: SignedOrder;
}
interface RfqtReportSource extends ReportSourceBase {
    liquiditySource: NativeOrderSource.Rfqt;
    nativeOrder: SignedOrder;
    makerUri: string;
}
type QuoteReportSource = BridgeReportSource | OrderbookReportSource | RfqtReportSource;

export interface QuoteReport {
    sourcesConsidered: QuoteReportSource[];
    pathGenerated: QuoteReportSource[];
}

export class QuoteReportGenerator {
    private _dexSamples: DexSample[];
    private _orderbookOrders: SignedOrder[];
    private _rfqtOrders: AnnotatedRfqtFirmQuote[];
    private _paths: (CollapsedFill | NativeCollapsedFill)[];
    private _marketOperation: MarketOperation;

    constructor(dexSamples: DexSample[], orderbookOrders: SignedOrder[], rfqtOrders: AnnotatedRfqtFirmQuote[], paths: CollapsedFill[], marketOperation: MarketOperation) {
        this._dexSamples = dexSamples;
        this._orderbookOrders = orderbookOrders;
        this._rfqtOrders = rfqtOrders;
        this._paths = paths;
        this._marketOperation = marketOperation;
    }

    public generateReport(): QuoteReport {

        const sourcesConsidered = [];
        sourcesConsidered.push(...this._dexSamplesToReportSources());
        sourcesConsidered.push(...this._orderbookOrdersToReportSources());
        sourcesConsidered.push(...this._rfqtOrdersToReportSources());

        const pathGenerated = this._pathsToQuoteReportSources();
        return {
            sourcesConsidered,
            pathGenerated
        }
    }

    private _dexSamplesToReportSources(): BridgeReportSource[] {
        return this._dexSamples.map(ds => this._dexSampleToBridgeReportSource(ds));
    }

    private _orderbookOrdersToReportSources(): OrderbookReportSource[] {
        return this._orderbookOrders.map(oo => {
            const orderbookReportSource: OrderbookReportSource = {
                makerAmount: oo.makerAssetAmount,
                takerAmount: oo.takerAssetAmount,
                liquiditySource: NativeOrderSource.Orderbook,
                nativeOrder: oo
            };
            return orderbookReportSource;
        })
    }

    private _rfqtOrdersToReportSources(): RfqtReportSource[] {
        return this._rfqtOrders.map(ro => {
            const { signedOrder, makerUri } = ro;
            const rfqtOrder: RfqtReportSource = {
                liquiditySource: NativeOrderSource.Rfqt,
                makerAmount: signedOrder.makerAssetAmount,
                takerAmount: signedOrder.takerAssetAmount,
                nativeOrder: signedOrder,
                makerUri
            };
            return rfqtOrder;
        })
    }

    private _pathsToQuoteReportSources(): QuoteReportSource[] {
        return this._paths.map(p => {
            if ((p as NativeCollapsedFill).nativeOrder) {
                const nativeFill: NativeCollapsedFill = p as NativeCollapsedFill;
                const nativeOrder = nativeFill.nativeOrder;

                // if it's an rfqt order, try to associate it & find it
                if (nativeOrder.takerAddress !== undefined) {
                    const foundRfqtOrder = (this._rfqtOrders.find((ro) =>
                        ro.signedOrder.signature === nativeOrder.signature
                    ));
                    if (foundRfqtOrder) {
                        const rfqtOrder: RfqtReportSource = {
                            liquiditySource: NativeOrderSource.Rfqt,
                            makerAmount: nativeOrder.makerAssetAmount,
                            takerAmount: nativeOrder.takerAssetAmount,
                            nativeOrder: nativeOrder,
                            makerUri: foundRfqtOrder.makerUri,
                        };
                        return rfqtOrder;
                    }
                }
                // otherwise, orderbook
                const orderbookOrder: OrderbookReportSource = {
                    makerAmount: nativeOrder.makerAssetAmount,
                    takerAmount: nativeOrder.takerAssetAmount,
                    liquiditySource: NativeOrderSource.Orderbook,
                    nativeOrder: nativeOrder
                };
                return orderbookOrder;
            } else {
                return this._dexSampleToBridgeReportSource(p);
            }
        })
    }

    private _dexSampleToBridgeReportSource(ds: DexSample): BridgeReportSource {
        const liquiditySource = ds.source;
        // input and output map to different values
        // based on the market operation
        if (this._marketOperation === MarketOperation.Buy) {
            return {
                makerAmount: ds.input,
                takerAmount: ds.output,
                liquiditySource
            }
        } else if (this._marketOperation === MarketOperation.Sell) {
            return {
                makerAmount: ds.output,
                takerAmount: ds.input,
                liquiditySource
            }
        } else {
            throw new Error(`Unexpected marketOperation ${this._marketOperation}`);
        }
    }
}