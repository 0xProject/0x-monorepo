import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { AssetType } from '../types';
import { bigNumberTransformer } from '../utils';

// Contains orders obtained from an SRA endpoint.
@Entity({ name: 'sra_orders', schema: 'raw' })
export class SraOrder {
    // The address of the exchange contract for this order (e.g. might be the
    // address of the V1 exchange or the V2 one).
    @PrimaryColumn({ name: 'exchange_address' })
    public exchangeAddress!: string;
    // The hash of the order.
    @PrimaryColumn({ name: 'order_hash_hex' })
    public orderHashHex!: string;
    // The URL of an SRA endpoint where this order was found.
    @PrimaryColumn({ name: 'source_url' })
    public sourceUrl!: string;

    // The adddress of the maker.
    @Column({ name: 'maker_address' })
    public makerAddress!: string;
    // The address of the taker (may be null).
    @Column({ name: 'taker_address' })
    public takerAddress!: string;
    // The address of the fee recepient. Can be used to identify the relayer.
    @Column({ name: 'fee_recipient_address' })
    public feeRecipientAddress!: string;
    // The address of the sender (used for extension contracts).
    @Column({ name: 'sender_address' })
    public senderAddress!: string;
    // The amount of maker_maker asset provided by the maker.
    @Column({ name: 'maker_asset_amount', type: 'numeric', transformer: bigNumberTransformer })
    public makerAssetAmount!: BigNumber;
    // The amount of taker_asset provided by the taker.
    @Column({ name: 'taker_asset_amount', type: 'numeric', transformer: bigNumberTransformer })
    public takerAssetAmount!: BigNumber;
    // The fee paid by the maker.
    @Column({ name: 'maker_fee', type: 'numeric', transformer: bigNumberTransformer })
    public makerFee!: BigNumber;
    // The fee paid by the taker.
    @Column({ name: 'taker_fee', type: 'numeric', transformer: bigNumberTransformer })
    public takerFee!: BigNumber;
    // Timestamp in seconds when the order should be considered expired.
    @Column({ name: 'expiration_time_seconds', type: 'numeric', transformer: bigNumberTransformer })
    public expirationTimeSeconds!: BigNumber;
    // A monotonically increasing unique number (typically a timestamp).
    @Column({ name: 'salt', type: 'numeric', transformer: bigNumberTransformer })
    public salt!: BigNumber;
    // The signature for this order (used for verification).
    @Column({ name: 'signature' })
    public signature!: string;

    // The raw maker asset data.
    @Column({ name: 'raw_maker_asset_data' })
    public rawMakerAssetData!: string;
    // The maker asset type (e.g. 'erc20' or 'erc721').
    @Column({ name: 'maker_asset_type' })
    public makerAssetType!: AssetType;
    // The id of the AssetProxy used for the maker asset.
    @Column({ name: 'maker_asset_proxy_id' })
    public makerAssetProxyId!: string;
    // The address of the maker token.
    @Column({ name: 'maker_token_address' })
    public makerTokenAddress!: string;
    // The id of the maker token (always null for ERC20 tokens).;
    @Column({ nullable: true, type: String, name: 'maker_token_id' })
    public makerTokenId!: string | null;
    // The raw taker asset data.
    @Column({ name: 'raw_taker_asset_data' })
    public rawTakerAssetData!: string;
    // The taker asset type (e.g. 'erc20' or 'erc721').
    @Column({ name: 'taker_asset_type' })
    public takerAssetType!: AssetType;
    // The id of the AssetProxy used for the taker asset.
    @Column({ name: 'taker_asset_proxy_id' })
    public takerAssetProxyId!: string;
    // The address of the taker token.
    @Column({ name: 'taker_token_address' })
    public takerTokenAddress!: string;
    // The id of the taker token (always null for ERC20 tokens).
    @Column({ nullable: true, type: String, name: 'taker_token_id' })
    public takerTokenId!: string | null;

    // TODO(albrow): Make this optional?
    // Arbitrary metadata associated with the order.
    @Column({ name: 'metadata_json' })
    public metadataJson!: string;
}
