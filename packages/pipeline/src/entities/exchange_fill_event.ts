import { Column, Entity, PrimaryColumn } from 'typeorm';

import { AssetType } from '../types';

@Entity({ name: 'exchange_fill_events' })
export class ExchangeFillEvent {
    @PrimaryColumn({ name: 'contract_address' })
    public contractAddress!: string;
    @PrimaryColumn({ name: 'log_index' })
    public logIndex!: number;
    @PrimaryColumn({ name: 'block_number' })
    public blockNumber!: number;

    @Column({ name: 'raw_data' })
    public rawData!: string;

    @Column({ name: 'transaction_hash' })
    public transactionHash!: string;
    @Column({ name: 'maker_address' })
    public makerAddress!: string;
    @Column({ name: 'taker_address' })
    public takerAddress!: string;
    @Column({ name: 'fee_recipient_address' })
    public feeRecipientAddress!: string;
    @Column({ name: 'sender_address' })
    public senderAddress!: string;
    @Column({ name: 'maker_asset_filled_amount' })
    public makerAssetFilledAmount!: string;
    @Column({ name: 'taker_asset_filled_amount' })
    public takerAssetFilledAmount!: string;
    @Column({ name: 'maker_fee_paid' })
    public makerFeePaid!: string;
    @Column({ name: 'taker_fee_paid' })
    public takerFeePaid!: string;
    @Column({ name: 'order_hash' })
    public orderHash!: string;

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

    // TODO(albrow): Include topics?
}
