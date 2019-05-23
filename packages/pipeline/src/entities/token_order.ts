import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { bigNumberTransformer, numberToBigIntTransformer } from '../utils';

// Contains orders from an order book snapshot. A "snapshot" is a view of some
// order book at a specific point in time. For most sources, the snapshots use
// "Level 2 Aggregation", which means that orders at the same price are grouped
// together. However, RadarRelay orders use something in between "Level 2
// Aggregation" and "Level 3 Aggregation" where orders are grouped by price and
// maker address. See
// https://datafireball.com/2017/11/29/gdax-orderbook-data-api-level123/ for
// more information about aggregation levels.
@Entity({ name: 'token_orderbook_snapshots', schema: 'raw' })
export class TokenOrderbookSnapshot {
    // The timestamp (in ms since Unix Epoch) at which the snapshot that
    // contains this order was taken.
    @PrimaryColumn({ name: 'observed_timestamp', type: 'bigint', transformer: numberToBigIntTransformer })
    public observedTimestamp!: number;
    // The source where the orders came from (e.g. "idex", "paradex").
    @PrimaryColumn({ name: 'source' })
    public source!: string;
    // The type of the aggregated orders (either "bid" or "ask").
    @PrimaryColumn({ name: 'order_type' })
    public orderType!: string;
    // The price of the aggregated orders.
    @PrimaryColumn({ name: 'price', type: 'numeric', transformer: bigNumberTransformer })
    public price!: BigNumber;
    // The base asset for the agregated orders.
    @PrimaryColumn({ name: 'base_asset_symbol' })
    public baseAssetSymbol!: string;
    // The quote asset for the agregated orders.
    @PrimaryColumn({ name: 'quote_asset_symbol' })
    public quoteAssetSymbol!: string;
    // The maker address for the aggregated orders. "unknown" for all sources
    // except RadarRelay.
    @PrimaryColumn({ type: String, name: 'maker_address', default: 'unknown' })
    public makerAddress!: string;
    // The address of the base asset for the aggregated orders.
    @Column({ nullable: true, type: String, name: 'base_asset_address' })
    public baseAssetAddress!: string | null;
    // The total base volume across all aggregated orders.
    @Column({ name: 'base_volume', type: 'numeric', transformer: bigNumberTransformer })
    public baseVolume!: BigNumber;
    // The address of the quote asset for the aggregated orders.
    @Column({ nullable: true, type: String, name: 'quote_asset_address' })
    public quoteAssetAddress!: string | null;
    // The total quote volume across all aggregated orders.
    @Column({ name: 'quote_volume', type: 'numeric', transformer: bigNumberTransformer })
    public quoteVolume!: BigNumber;
}
