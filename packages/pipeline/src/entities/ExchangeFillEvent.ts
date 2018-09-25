import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

export type ExchangeFillEventAssetType = 'erc20' | 'erc721';

@Entity()
export class ExchangeFillEvent extends BaseEntity {
    @PrimaryColumn() public logIndex!: number;

    @Column() public address!: string;
    @Column() public rawData!: string;
    @Column() public blockNumber!: number;

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
    @Column() public makerAssetType!: ExchangeFillEventAssetType;
    @Column() public makerAssetProxyId!: string;
    @Column() public makerTokenAddress!: string;
    @Column({ nullable: true, type: String })
    public makerTokenId!: string | null;
    @Column() public rawTakerAssetData!: string;
    @Column() public takerAssetType!: ExchangeFillEventAssetType;
    @Column() public takerAssetProxyId!: string;
    @Column() public takerTokenAddress!: string;
    @Column({ nullable: true, type: String })
    public takerTokenId!: string | null;
    // TODO(albrow): Include topics?
}
