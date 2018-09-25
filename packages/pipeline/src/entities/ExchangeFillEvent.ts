import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

import { AssetType } from '../types';

@Entity()
export class ExchangeFillEvent extends BaseEntity {
    @PrimaryColumn() public contractAddress!: string;
    @PrimaryColumn() public logIndex!: number;
    @PrimaryColumn() public blockNumber!: number;

    @Column() public rawData!: string;

    @Column() public makerAddress!: string;
    @Column() public takerAddress!: string;
    @Column() public feeRecepientAddress!: string;
    @Column() public senderAddress!: string;
    @Column() public makerAssetFilledAmount!: string;
    @Column() public takerAssetFilledAmount!: string;
    @Column() public makerFeePaid!: string;
    @Column() public takerFeePaid!: string;
    @Column() public orderHash!: string;
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
    // TODO(albrow): Include topics?
}
