import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { OrderType } from '../types';
import { bigNumberTransformer, numberToBigIntTransformer } from '../utils';

@Entity({ name: 'token_orderbook_snapshots', schema: 'raw' })
export class TokenOrderbookSnapshot {
    @PrimaryColumn({ name: 'source' })
    public source!: string;
    @PrimaryColumn({ name: 'retrieval_timestamp', type: 'bigint', transformer: numberToBigIntTransformer })
    public retrievalTimestamp!: number;
    @PrimaryColumn({ name: 'order_type' })
    public orderType!: OrderType;
    @PrimaryColumn({ name: 'base_asset_symbol' })
    public baseAssetSymbol!: string;
    @Column({ name: 'base_asset_address' })
    public baseAssetAddress!: string;
    @PrimaryColumn({ name: 'base_volume', type: 'numeric', transformer: bigNumberTransformer })
    public baseVolume!: BigNumber;
    @PrimaryColumn({ name: 'quote_asset_symbol' })
    public quoteAssetSymbol!: string;
    @Column({ name: 'quote_asset_address' })
    public quoteAssetAddress!: string;
    @PrimaryColumn({ name: 'quote_volume', type: 'numeric', transformer: bigNumberTransformer })
    public quoteVolume!: BigNumber;
}
