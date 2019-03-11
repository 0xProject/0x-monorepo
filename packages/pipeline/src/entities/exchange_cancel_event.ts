import { Column, Entity, PrimaryColumn } from 'typeorm';

import { AssetType } from '../types';
import { numberToBigIntTransformer } from '../utils';

// These events come directly from the Exchange contract and are fired whenever
// someone cancels an order.
// See https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#cancelorder
@Entity({ name: 'exchange_cancel_events', schema: 'raw' })
export class ExchangeCancelEvent {
    // The address of the smart contract where this event was fired.
    @PrimaryColumn({ name: 'contract_address' })
    public contractAddress!: string;
    // The index of the event log.
    @PrimaryColumn({ name: 'log_index' })
    public logIndex!: number;
    // The block number where the event occurred.
    @PrimaryColumn({ name: 'block_number', transformer: numberToBigIntTransformer })
    public blockNumber!: number;
    // The hash of the transaction where this event occurred.
    @PrimaryColumn({ name: 'transaction_hash' })
    public transactionHash!: string;

    // The raw data which comes directly from the event.
    @Column({ name: 'raw_data' })
    public rawData!: string;

    // Note: the following fields are parsed from the raw_data.

    // The address of the maker.
    @Column({ name: 'maker_address' })
    public makerAddress!: string;
    // The address of the taker (may be null).
    @Column({ nullable: true, type: String, name: 'taker_address' })
    public takerAddress!: string;
    // The address of the fee recepient. Can be used to identify the relayer.
    @Column({ name: 'fee_recipient_address' })
    public feeRecipientAddress!: string;
    // The address of the sender (used for extension contracts).
    @Column({ name: 'sender_address' })
    public senderAddress!: string;
    // The hash of the order that was cancelled.
    @Column({ name: 'order_hash' })
    public orderHash!: string;

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
    // The id of the maker token (always null for ERC20 tokens).
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
}
