import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { bigNumberTransformer, numberToBigIntTransformer } from '../utils';

@Entity({ name: 'nonfungible_dot_com', schema: 'raw' })
export class NftTrade {
    @PrimaryColumn({ name: 'transaction_hash' })
    public transactionHash!: string;
    @PrimaryColumn({ name: 'publisher' })
    public publisher!: string;

    @Column({ name: 'block_number', type: 'bigint', transformer: numberToBigIntTransformer })
    public blockNumber!: number;
    @Column({ name: 'log_index' })
    public logIndex!: number;
    @Column({ name: 'block_timestamp', type: 'bigint', transformer: numberToBigIntTransformer })
    public blockTimestamp!: number;
    @Column({ name: 'asset_id' })
    public assetId!: string;
    @Column({ name: 'asset_descriptor' })
    public assetDescriptor!: string;
    @Column({ name: 'market_address' })
    public marketAddress!: string;
    @Column({ name: 'total_price', type: 'numeric', transformer: bigNumberTransformer })
    public totalPrice!: BigNumber;
    @Column({ name: 'usd_price' })
    public usdPrice!: number;
    @Column({ name: 'buyer_address' })
    public buyerAddress!: string;
    @Column({ name: 'seller_address' })
    public sellerAddress!: string;
    @Column({ type: 'jsonb' })
    public meta!: object;
}
