import { orderHashUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { ERC20BridgeSource, SignedOrder } from '..';
import { MarketOperation } from '../types';

import { CollapsedFill, DexSample, NativeCollapsedFill } from './market_operation_utils/types';
import { QuoteRequestor } from './quote_requestor';

export interface BridgeReportSource {
    liquiditySource: Exclude<ERC20BridgeSource, ERC20BridgeSource.Native>;
    makerAmount: BigNumber;
    takerAmount: BigNumber;
}

interface NativeReportSourceBase {
    liquiditySource: ERC20BridgeSource.Native;
    makerAmount: BigNumber;
    takerAmount: BigNumber;
    orderHash: string;
    nativeOrder: SignedOrder;
    fillableTakerAmount: BigNumber;
}
export interface NativeOrderbookReportSource extends NativeReportSourceBase {
    isRfqt: false;
}
export interface NativeRFQTReportSource extends NativeReportSourceBase {
    isRfqt: true;
    makerUri: string;
}
export type QuoteReportSource = BridgeReportSource | NativeOrderbookReportSource | NativeRFQTReportSource;

export interface QuoteReport {
    sourcesConsidered: QuoteReportSource[];
    sourcesDelivered: QuoteReportSource[];
}

const nativeOrderFromCollapsedFill = (cf: CollapsedFill): SignedOrder | undefined => {
    // Cast as NativeCollapsedFill and then check
    // if it really is a NativeCollapsedFill
    const possibleNativeCollapsedFill = (cf as NativeCollapsedFill);
    if (possibleNativeCollapsedFill.fillData && possibleNativeCollapsedFill.fillData.order) {
        return possibleNativeCollapsedFill.fillData.order;
    } else {
        return undefined;
    }
};

export class QuoteReportGenerator {
    private readonly _dexQuotes: DexSample[];
    private readonly _nativeOrders: SignedOrder[];
    private readonly _orderHashesToFillableAmounts: { [orderHash: string]: BigNumber };
    private readonly _marketOperation: MarketOperation;
    private readonly _collapsedFills: CollapsedFill[];
    private readonly _quoteRequestor?: QuoteRequestor;

    constructor(
        marketOperation: MarketOperation,
        dexQuotes: DexSample[],
        nativeOrders: SignedOrder[],
        orderFillableAmounts: BigNumber[],
        collapsedFills: CollapsedFill[],
        quoteRequestor?: QuoteRequestor,
    ) {
        this._dexQuotes = dexQuotes;
        this._nativeOrders = nativeOrders;
        this._marketOperation = marketOperation;
        this._quoteRequestor = quoteRequestor;
        this._collapsedFills = collapsedFills;

        // convert order fillable amount array to easy to look up hash
        if (orderFillableAmounts.length !== nativeOrders.length) {
            // length mismatch, abort
            this._orderHashesToFillableAmounts = {};
            return;
        }
        const orderHashesToFillableAmounts: { [orderHash: string]: BigNumber } = {};
        nativeOrders.forEach((nativeOrder, idx) => {
            orderHashesToFillableAmounts[orderHashUtils.getOrderHash(nativeOrder)] = orderFillableAmounts[idx];
        });
        this._orderHashesToFillableAmounts = orderHashesToFillableAmounts;
    }

    public generateReport(): QuoteReport {
        const dexReportSourcesConsidered = this._dexQuotes.map(dq => this._dexSampleToReportSource(dq));
        const nativeOrderSourcesConsidered = this._nativeOrders.map(no => this._nativeOrderToReportSource(no));

        const sourcesConsidered = [...dexReportSourcesConsidered, ...nativeOrderSourcesConsidered];
        const sourcesDelivered = this._collapsedFills.map(collapsedFill => {
            const foundNativeOrder = nativeOrderFromCollapsedFill(collapsedFill);
            if (foundNativeOrder) {
                return this._nativeOrderToReportSource(foundNativeOrder);
            } else {
                return this._dexSampleToReportSource(collapsedFill);
            }
        });

        return {
            sourcesConsidered,
            sourcesDelivered,
        };
    }

    private _dexSampleToReportSource(ds: DexSample): BridgeReportSource {
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

    private _nativeOrderToReportSource(nativeOrder: SignedOrder): NativeRFQTReportSource | NativeOrderbookReportSource {
        const orderHash = orderHashUtils.getOrderHash(nativeOrder);

        const nativeOrderBase: NativeReportSourceBase = {
            liquiditySource: ERC20BridgeSource.Native,
            makerAmount: nativeOrder.makerAssetAmount,
            takerAmount: nativeOrder.takerAssetAmount,
            fillableTakerAmount: this._orderHashesToFillableAmounts[orderHash],
            nativeOrder,
            orderHash,
        };

        // if we find this is an rfqt order, label it as such and associate makerUri
        const foundRfqtMakerUri = this._quoteRequestor && this._quoteRequestor.getMakerUriForOrderHash(orderHash);
        if (foundRfqtMakerUri) {
            const rfqtSource: NativeRFQTReportSource = {
                ...nativeOrderBase,
                isRfqt: true,
                makerUri: foundRfqtMakerUri,
            };
            return rfqtSource;
        } else {
            // if it's not an rfqt order, treat as normal
            const regularNativeOrder: NativeOrderbookReportSource = {
                ...nativeOrderBase,
                isRfqt: false,
            };
            return regularNativeOrder;
        }
    }
}
