import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { AssetType } from '../types';
import { bigNumberTransformer } from '../utils';

@Entity({ name: 'sra_orders', schema: 'raw' })
export class SraOrder {
    @PrimaryColumn({ name: 'exchange_address' })
    public exchangeAddress!: string;
    @PrimaryColumn({ name: 'order_hash_hex' })
    public orderHashHex!: string;
    @PrimaryColumn({ name: 'source_url' })
    public sourceUrl!: string;

    @Column({ name: 'maker_address' })
    public makerAddress!: string;
    @Column({ name: 'taker_address' })
    public takerAddress!: string;
    @Column({ name: 'fee_recipient_address' })
    public feeRecipientAddress!: string;
    @Column({ name: 'sender_address' })
    public senderAddress!: string;
    @Column({ name: 'maker_asset_amount', type: 'numeric', transformer: bigNumberTransformer })
    public makerAssetAmount!: BigNumber;
    @Column({ name: 'taker_asset_amount', type: 'numeric', transformer: bigNumberTransformer })
    public takerAssetAmount!: BigNumber;
    @Column({ name: 'maker_fee', type: 'numeric', transformer: bigNumberTransformer })
    public makerFee!: BigNumber;
    @Column({ name: 'taker_fee', type: 'numeric', transformer: bigNumberTransformer })
    public takerFee!: BigNumber;
    @Column({ name: 'expiration_time_seconds', type: 'numeric', transformer: bigNumberTransformer })
    public expirationTimeSeconds!: BigNumber;
    @Column({ name: 'salt', type: 'numeric', transformer: bigNumberTransformer })
    public salt!: BigNumber;
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
