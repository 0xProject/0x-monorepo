import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { AssetType } from '../types';
import { bigNumberTransformer, numberToBigIntTransformer } from '../utils';

@Entity({ name: 'exchange_fill_events', schema: 'raw' })
export class ExchangeFillEvent {
    @PrimaryColumn({ name: 'contract_address' })
    public contractAddress!: string;
    @PrimaryColumn({ name: 'log_index' })
    public logIndex!: number;
    @PrimaryColumn({ name: 'block_number', transformer: numberToBigIntTransformer })
    public blockNumber!: number;

    @Column({ name: 'raw_data' })
    public rawData!: string;

    @PrimaryColumn({ name: 'transaction_hash' })
    public transactionHash!: string;
    @Column({ name: 'maker_address' })
    public makerAddress!: string;
    @Column({ name: 'taker_address' })
    public takerAddress!: string;
    @Column({ name: 'fee_recipient_address' })
    public feeRecipientAddress!: string;
    @Column({ name: 'sender_address' })
    public senderAddress!: string;
    @Column({ name: 'maker_asset_filled_amount', type: 'numeric', transformer: bigNumberTransformer })
    public makerAssetFilledAmount!: BigNumber;
    @Column({ name: 'taker_asset_filled_amount', type: 'numeric', transformer: bigNumberTransformer })
    public takerAssetFilledAmount!: BigNumber;
    @Column({ name: 'maker_fee_paid', type: 'numeric', transformer: bigNumberTransformer })
    public makerFeePaid!: BigNumber;
    @Column({ name: 'taker_fee_paid', type: 'numeric', transformer: bigNumberTransformer })
    public takerFeePaid!: BigNumber;
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
}
