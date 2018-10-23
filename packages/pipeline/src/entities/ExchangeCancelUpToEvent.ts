import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class ExchangeCancelUpToEvent {
    @PrimaryColumn() public contractAddress!: string;
    @PrimaryColumn() public logIndex!: number;
    @PrimaryColumn() public blockNumber!: number;

    // TODO(albrow): Include transaction hash
    @Column() public rawData!: string;

    @Column() public makerAddress!: string;
    @Column() public senderAddress!: string;
    @Column() public orderEpoch!: string;
    // TODO(albrow): Include topics?
}
