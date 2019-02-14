import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { bigNumberTransformer, numberToBigIntTransformer } from '../utils';

@Entity({ name: 'token_orderbook_snapshots', schema: 'raw' })
export class TokenOrderbookSnapshot {
    @PrimaryColumn({ name: 'observed_timestamp', type: 'bigint', transformer: numberToBigIntTransformer })
    public observedTimestamp!: number;
    @PrimaryColumn({ name: 'source' })
    public source!: string;
    @PrimaryColumn({ name: 'order_type' })
    public orderType!: string;
    @PrimaryColumn({ name: 'price', type: 'numeric', transformer: bigNumberTransformer })
    public price!: BigNumber;
    @PrimaryColumn({ name: 'base_asset_symbol' })
    public baseAssetSymbol!: string;
    @PrimaryColumn({ name: 'quote_asset_symbol' })
    public quoteAssetSymbol!: string;
    @PrimaryColumn({ type: String, name: 'maker_address', default: 'unknown' })
    public makerAddress!: string;
    @Column({ nullable: true, type: String, name: 'base_asset_address' })
    public baseAssetAddress!: string | null;
    @Column({ name: 'base_volume', type: 'numeric', transformer: bigNumberTransformer })
    public baseVolume!: BigNumber;
    @Column({ nullable: true, type: String, name: 'quote_asset_address' })
    public quoteAssetAddress!: string | null;
    @Column({ name: 'quote_volume', type: 'numeric', transformer: bigNumberTransformer })
    public quoteVolume!: BigNumber;
}
