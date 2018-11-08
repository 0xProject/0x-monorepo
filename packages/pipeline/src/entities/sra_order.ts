import { Column, Entity, PrimaryColumn } from 'typeorm';

import { AssetType } from '../types';

@Entity({ name: 'sra_orders' })
export class SraOrder {
    @PrimaryColumn({ name: 'exchange_address' })
    public exchangeAddress!: string;
    @PrimaryColumn({ name: 'order_hash_hex' })
    public orderHashHex!: string;

    @Column({ name: 'source_url' })
    public sourceUrl!: string;
    @Column({ name: 'last_updated_timestamp' })
    public lastUpdatedTimestamp!: number;
    @Column({ name: 'first_seen_timestamp' })
    public firstSeenTimestamp!: number;

    @Column({ name: 'maker_address' })
    public makerAddress!: string;
    @Column({ name: 'taker_address' })
    public takerAddress!: string;
    @Column({ name: 'fee_recipient_address' })
    public feeRecipientAddress!: string;
    @Column({ name: 'sender_address' })
    public senderAddress!: string;
    @Column({ name: 'maker_asset_amount' })
    public makerAssetAmount!: string;
    @Column({ name: 'taker_asset_amount' })
    public takerAssetAmount!: string;
    @Column({ name: 'maker_fee' })
    public makerFee!: string;
    @Column({ name: 'taker_fee' })
    public takerFee!: string;
    @Column({ name: 'expiration_time_seconds' })
    public expirationTimeSeconds!: string;
    @Column({ name: 'salt' })
    public salt!: string;
    @Column({ name: 'signature' })
    public signature!: string;

    @Column({ name: 'raw_maker_asset_data' })
    public rawMakerAssetData!: string;
    @Column({ name: 'maker_asset_type' })
    public makerAssetType!: AssetType;
    @Column({ name: 'maker_asset_proxy_id' })
    public makerAssetProxyId!: string;
    @Column({ name: 'maker_token_address' })
    public makerTokenAddress!: string;
    @Column({ nullable: true, type: String, name: 'maker_token_id' })
    public makerTokenId!: string | null;
    @Column({ name: 'raw_taker_asset_data' })
    public rawTakerAssetData!: string;
    @Column({ name: 'taker_asset_type' })
    public takerAssetType!: AssetType;
    @Column({ name: 'taker_asset_proxy_id' })
    public takerAssetProxyId!: string;
    @Column({ name: 'taker_token_address' })
    public takerTokenAddress!: string;
    @Column({ nullable: true, type: String, name: 'taker_token_id' })
    public takerTokenId!: string | null;

    // TODO(albrow): Make this optional?
    @Column({ name: 'metadata_json' })
    public metadataJson!: string;
}
