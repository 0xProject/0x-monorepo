import { orderHashUtils } from '@0x/order-utils';
import { BigNumber, NULL_ADDRESS } from '@0x/utils';
import * as _ from 'lodash';

import { ERC20BridgeSource, SignedOrder } from '..';
import { MarketOperation } from '../types';

import { CollapsedFill, DexSample, NativeCollapsedFill } from './market_operation_utils/types';

/**
 * Differentiates different sources of native 0x order
 */
export enum NativeOrderOrigin {
    RfqtOrigin = 'Rfqt',
    OrderbookOrigin = 'Orderbook',
}

/**
 * Represents a report of non-native liquidity source
 */
export interface BridgeReportSource {
    liquiditySource: Exclude<ERC20BridgeSource, ERC20BridgeSource.Native>;
    makerAmount: BigNumber;
    takerAmount: BigNumber;
}

interface NativeLiquiditySource {
    liquiditySource: ERC20BridgeSource.Native;
    makerAmount: BigNumber;
    takerAmount: BigNumber;
    nativeOrder: SignedOrder;
    fillableTakerAmount?: BigNumber;
}

export interface OrderbookReportSource extends NativeLiquiditySource {
    nativeOrderOrigin: NativeOrderOrigin.OrderbookOrigin;
}
export interface RfqtReportSource extends NativeLiquiditySource {
    nativeOrderOrigin: NativeOrderOrigin.RfqtOrigin;
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
    sourcesDelivered: QuoteReportSource[];
}

/**
 * Class responsible for keeping track of all liquidity sources considered
 * and the actual path generated while generating a SwapQuote
 */
export class QuoteReporter {
    private readonly _marketOperation: MarketOperation;
    private _orderbookReportSources: OrderbookReportSource[];
    private _rfqtReportSources: RfqtReportSource[];
    private _bridgeReportSources: BridgeReportSource[];
    private _sourcesDelivered: QuoteReportSource[];

    constructor(marketOperation: MarketOperation) {
        this._orderbookReportSources = [];
        this._rfqtReportSources = [];
        this._bridgeReportSources = [];
        this._sourcesDelivered = [];
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
                liquiditySource: ERC20BridgeSource.Native,
                nativeOrderOrigin: NativeOrderOrigin.OrderbookOrigin,
                nativeOrder: oo,
            };
            return orderbookReportSource;
        });
    }

    public trackRfqtOrder(ro: { signedOrder: SignedOrder; makerUri: string }): void {
        const { signedOrder, makerUri } = ro;
        const rfqtReportSource: RfqtReportSource = {
            liquiditySource: ERC20BridgeSource.Native,
            nativeOrderOrigin: NativeOrderOrigin.RfqtOrigin,
            makerAmount: signedOrder.makerAssetAmount,
            takerAmount: signedOrder.takerAssetAmount,
            nativeOrder: signedOrder,
            makerUri,
        };
        this._rfqtReportSources = this._rfqtReportSources.concat(rfqtReportSource);
    }

    /**
     * Annotates native order sources with fillableAmounts
     */
    public trackFillableAmounts(fillableAmounts: BigNumber[], orders: SignedOrder[]): void {
        if (fillableAmounts.length !== orders.length) {
            // length mismatch, don't do anything
            return;
        }

        // Create mapping of orderHash -> fillableAMount
        const orderHashesToFillableAmounts: { [orderHash: string]: BigNumber } = {};
        orders.forEach((order, idx) => {
            orderHashesToFillableAmounts[orderHashUtils.getOrderHash(order)] = fillableAmounts[idx];
        });

        // Annotate RFQT & OO orders with fillable amounts
        this._rfqtReportSources = this._rfqtReportSources.map(ros => {
            const orderHash = orderHashUtils.getOrderHash(ros.nativeOrder);
            return { ...ros, fillableAmount: orderHashesToFillableAmounts[orderHash] };
        });
        this._orderbookReportSources = this._orderbookReportSources.map(ors => {
            const orderHash = orderHashUtils.getOrderHash(ors.nativeOrder);
            return { ...ors, fillableAmount: orderHashesToFillableAmounts[orderHash] };
        });
    }

    public trackPaths(paths: CollapsedFill[]): void {
        const sourcesDelivered = paths.map(p => {
            if ((p as NativeCollapsedFill).nativeOrder) {
                const nativeFill: NativeCollapsedFill = p as NativeCollapsedFill;
                const nativeOrder = nativeFill.nativeOrder;

                // if it's an rfqt order, try to associate it & find it
                if (
                    nativeOrder.takerAddress !== undefined &&
                    nativeOrder.takerAddress.toLowerCase() !== NULL_ADDRESS.toLowerCase()
                ) {
                    const foundRfqtOrder = this._rfqtReportSources.find(
                        ro => orderHashUtils.getOrderHash(ro.nativeOrder) === orderHashUtils.getOrderHash(nativeOrder),
                    );
                    return foundRfqtOrder;
                }
                // else, find & associate the orderbook source
                const foundOrderbookOrder = this._orderbookReportSources.find(
                    os => orderHashUtils.getOrderHash(os.nativeOrder) === orderHashUtils.getOrderHash(nativeOrder),
                );
                return foundOrderbookOrder;
            } else {
                return this._dexSampleToBridgeReportSource(p);
            }
        });

        this._sourcesDelivered = _.compact(sourcesDelivered);
    }

    public getReport(): QuoteReport {
        const sourcesConsidered: QuoteReportSource[] = [];
        sourcesConsidered.push(...this._bridgeReportSources);
        sourcesConsidered.push(...this._orderbookReportSources);
        sourcesConsidered.push(...this._rfqtReportSources);

        return {
            sourcesConsidered,
            sourcesDelivered: this._sourcesDelivered,
        };
    }

    private _dexSampleToBridgeReportSource(ds: DexSample): BridgeReportSource {
        const liquiditySource = ds.source;

        if (liquiditySource === ERC20BridgeSource.Native) {
            throw new Error(`Unexpected liquidity source Native`);
        }

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
