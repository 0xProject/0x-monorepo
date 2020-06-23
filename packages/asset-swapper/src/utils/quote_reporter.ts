import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { ERC20BridgeSource, SignedOrder } from '..';

import { MarketOperation } from './../types';
import { CollapsedFill, DexSample, NativeCollapsedFill } from './market_operation_utils/types';

/**
 * Differentiates different sources of native 0x order
 */
export enum NativeOrderSource {
    RfqtSource = 'Rfqt',
    OrderbookSource = 'Orderbook',
}

interface ReportSourceBase {
    makerAmount: BigNumber;
    takerAmount: BigNumber;
}
export interface BridgeReportSource extends ReportSourceBase {
    liquiditySource: ERC20BridgeSource;
}
export interface OrderbookReportSource extends ReportSourceBase {
    liquiditySource: NativeOrderSource.OrderbookSource;
    nativeOrder: SignedOrder;
}
export interface RfqtReportSource extends ReportSourceBase {
    liquiditySource: NativeOrderSource.RfqtSource;
    nativeOrder: SignedOrder;
    makerUri: string;
}
/**
 * Standardized representation of liquidity sources used in QuoteReport
 */
export type QuoteReportSource = BridgeReportSource | OrderbookReportSource | RfqtReportSource;

/**
 * Object representing a report of all liquidity sources
 * considered during SwapQuote generation, as well as the path that
 * was ultimately generated.
 */
export interface QuoteReport {
    sourcesConsidered: QuoteReportSource[];
    pathGenerated: QuoteReportSource[];
}

/**
 * Class responsible for keeping track of all liquidity sources considered
 * and the actual path generated while generating a SwapQuote
 */
export class QuoteReporter {
    private readonly _marketOperation: MarketOperation;
    private _orderbookReportSources: OrderbookReportSource[];
    private readonly _rfqtReportSources: RfqtReportSource[];
    private _bridgeReportSources: BridgeReportSource[];
    private _pathGenerated: QuoteReportSource[];

    constructor(marketOperation: MarketOperation) {
        this._orderbookReportSources = [];
        this._rfqtReportSources = [];
        this._bridgeReportSources = [];
        this._pathGenerated = [];
        this._marketOperation = marketOperation;
    }

    public trackDexSamples(dexSamples: DexSample[]): void {
        this._bridgeReportSources = dexSamples.map(ds => this._dexSampleToBridgeReportSource(ds));
    }

    public trackOrderbookOrders(orderbookOrders: SignedOrder[]): void {
        this._orderbookReportSources = orderbookOrders.map(oo => {
            const orderbookReportSource: OrderbookReportSource = {
                makerAmount: oo.makerAssetAmount,
                takerAmount: oo.takerAssetAmount,
                liquiditySource: NativeOrderSource.OrderbookSource,
                nativeOrder: oo,
            };
            return orderbookReportSource;
        });
    }

    public trackRfqtOrder(ro: { signedOrder: SignedOrder; makerUri: string }): void {
        const { signedOrder, makerUri } = ro;
        const rfqtReportSource: RfqtReportSource = {
            liquiditySource: NativeOrderSource.RfqtSource,
            makerAmount: signedOrder.makerAssetAmount,
            takerAmount: signedOrder.takerAssetAmount,
            nativeOrder: signedOrder,
            makerUri,
        };
        this._rfqtReportSources.push(rfqtReportSource);
    }

    public trackPaths(paths: CollapsedFill[]): void {
        this._pathGenerated = paths.map(p => {
            if ((p as NativeCollapsedFill).nativeOrder) {
                const nativeFill: NativeCollapsedFill = p as NativeCollapsedFill;
                const nativeOrder = nativeFill.nativeOrder;

                // if it's an rfqt order, try to associate it & find it
                if (nativeOrder.takerAddress !== undefined) {
                    const foundRfqtSource = this._rfqtReportSources.find(
                        ro => ro.nativeOrder.signature === nativeOrder.signature,
                    );
                    if (foundRfqtSource) {
                        return foundRfqtSource;
                    }
                }
                // otherwise, assume its an orderbook order
                const orderbookOrder: OrderbookReportSource = {
                    makerAmount: nativeOrder.makerAssetAmount,
                    takerAmount: nativeOrder.takerAssetAmount,
                    liquiditySource: NativeOrderSource.OrderbookSource,
                    nativeOrder,
                };
                return orderbookOrder;
            } else {
                return this._dexSampleToBridgeReportSource(p);
            }
        });
    }

    public getReport(): QuoteReport {
        const sourcesConsidered: QuoteReportSource[] = [];
        sourcesConsidered.push(...this._bridgeReportSources);
        sourcesConsidered.push(...this._orderbookReportSources);
        sourcesConsidered.push(...this._rfqtReportSources);

        return {
            sourcesConsidered,
            pathGenerated: this._pathGenerated,
        };
    }

    private _dexSampleToBridgeReportSource(ds: DexSample): BridgeReportSource {
        const liquiditySource = ds.source;
        // input and output map to different values
        // based on the market operation
        if (this._marketOperation === MarketOperation.Buy) {
            return {
                makerAmount: ds.input,
                takerAmount: ds.output,
                liquiditySource,
            };
        } else if (this._marketOperation === MarketOperation.Sell) {
            return {
                makerAmount: ds.output,
                takerAmount: ds.input,
                liquiditySource,
            };
        } else {
            throw new Error(`Unexpected marketOperation ${this._marketOperation}`);
        }
    }
}
