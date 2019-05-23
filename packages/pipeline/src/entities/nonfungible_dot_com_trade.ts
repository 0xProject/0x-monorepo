import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { bigNumberTransformer, numberToBigIntTransformer } from '../utils';

// Contains trades that come from the Nonfungible.com API.
@Entity({ name: 'nonfungible_dot_com_trades', schema: 'raw' })
export class NonfungibleDotComTrade {
    // The hash of the transaction where the trade occurred.
    @PrimaryColumn({ name: 'transaction_hash' })
    public transactionHash!: string;
    // The publisher for the trade (e.g. "cryptopunks", "etherbots")
    @PrimaryColumn({ name: 'publisher' })
    public publisher!: string;
    // The block number where the trade occurred.
    @PrimaryColumn({ name: 'block_number', type: 'bigint', transformer: numberToBigIntTransformer })
    public blockNumber!: number;
    // The index of the event log.
    @PrimaryColumn({ name: 'log_index' })
    public logIndex!: number;
    // A unique identifier for the asset.
    @PrimaryColumn({ name: 'asset_id' })
    public assetId!: string;

    // The timestmap of the block where the trade occurred. (In ms since Unix Epoch)
    @Column({ name: 'block_timestamp', type: 'bigint', transformer: numberToBigIntTransformer })
    public blockTimestamp!: number;
    // An arbitrary string describing the asset (may be empty).
    @Column({ name: 'asset_descriptor' })
    public assetDescriptor!: string;
    // The address of the market/smart contract where the trade occurred.
    @Column({ name: 'market_address' })
    public marketAddress!: string;
    // The total price in base units for the asset.
    @Column({ name: 'total_price', type: 'numeric', transformer: bigNumberTransformer })
    public totalPrice!: BigNumber;
    // The estimated USD price for the asset.
    @Column({ name: 'usd_price', type: 'numeric', transformer: bigNumberTransformer })
    public usdPrice!: BigNumber;
    // The address of the buyer.
    @Column({ name: 'buyer_address' })
    public buyerAddress!: string;
    // The address of the seller.
    @Column({ name: 'seller_address' })
    public sellerAddress!: string;
    // Arbitrary, market-specific data corresponding to the trade.
    @Column({ type: 'jsonb' })
    public meta!: object;
}
