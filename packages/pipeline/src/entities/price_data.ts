import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";


@Entity({ name: 'exchange_observations', schema: 'raw' })
export class ExchangeObservations {

    @PrimaryGeneratedColumn({ name: 'id' })
    public id!: number;

    @Column({ type: 'timestamp' })
    public timestamp!: Date;

    @Column({ type: 'varchar' })
    public exchange!: string;

    @Column({ type: 'varchar' })
    public base!: string;

    @Column({ type: 'varchar' })
    public quote!: string;

    @Column({ type: 'float' })
    public open?: number

    @Column({ type: 'float' })
    public close?: number

    @Column({ type: 'float' })
    public high?: number

    @Column({ type: 'float' })
    public low?: number

    @Column({ type: 'float', name: "volume_from" })
    public volumeFrom?: number

    @Column({ type: 'float', name: "volume_to" })
    public volumeTo?: number

    @Column({ type: 'float', name: "highest_bid" })
    public highestBid?: number

    @Column({ type: 'float', name: "lowest_ask" })
    public lowestAsk?: number

    @Column({ type: 'simple-json' })
    public other?: {}
}