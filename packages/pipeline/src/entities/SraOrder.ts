import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

import { AssetType } from '../types';

@Entity()
export class SraOrder extends BaseEntity {
    @PrimaryColumn() public exchangeAddress!: string;
    @PrimaryColumn() public orderHashHex!: string;

    @Column() public lastUpdatedTimestamp!: number;
    @Column() public firstSeenTimestamp!: number;

    @Column() public makerAddress!: string;
    @Column() public takerAddress!: string;
    @Column() public feeRecipientAddress!: string;
    @Column() public senderAddress!: string;
    @Column() public makerAssetAmount!: string;
    @Column() public takerAssetAmount!: string;
    @Column() public makerFee!: string;
    @Column() public takerFee!: string;
    @Column() public expirationTimeSeconds!: string;
    @Column() public salt!: string;
    @Column() public signature!: string;

    @Column() public rawMakerAssetData!: string;
    @Column() public makerAssetType!: AssetType;
    @Column() public makerAssetProxyId!: string;
    @Column() public makerTokenAddress!: string;
    @Column({ nullable: true, type: String })
    public makerTokenId!: string | null;
    @Column() public rawTakerAssetData!: string;
    @Column() public takerAssetType!: AssetType;
    @Column() public takerAssetProxyId!: string;
    @Column() public takerTokenAddress!: string;
    @Column({ nullable: true, type: String })
    public takerTokenId!: string | null;

    // TODO(albrow): Make this optional?
    @Column() public metaDataJson!: string;
}
