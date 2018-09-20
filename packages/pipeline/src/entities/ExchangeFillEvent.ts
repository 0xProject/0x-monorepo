import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class ExchangeFillEvent {
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
    // TODO(albrow): Decode asset data.
    @Column() public makerAssetData!: string;
    @Column() public takerAssetData!: string;
    // TODO(albrow): Include topics?
}
