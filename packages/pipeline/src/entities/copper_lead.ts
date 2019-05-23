import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

import { numberToBigIntTransformer } from '../utils';

@Entity({ name: 'copper_leads', schema: 'raw' })
export class CopperLead {
    @PrimaryColumn({ type: 'bigint', transformer: numberToBigIntTransformer })
    public id!: number;

    @Column({ name: 'name', type: 'varchar', nullable: true })
    public name?: string;
    @Column({ name: 'first_name', type: 'varchar', nullable: true })
    public firstName?: string;
    @Column({ name: 'last_name', type: 'varchar', nullable: true })
    public lastName?: string;
    @Column({ name: 'middle_name', type: 'varchar', nullable: true })
    public middleName?: string;
    @Column({ name: 'assignee_id', type: 'bigint', transformer: numberToBigIntTransformer, nullable: true })
    public assigneeId?: number;
    @Column({ name: 'company_name', type: 'varchar', nullable: true })
    public companyName?: string;
    @Column({ name: 'customer_source_id', type: 'bigint', transformer: numberToBigIntTransformer, nullable: true })
    public customerSourceId?: number;
    @Column({ name: 'monetary_value', type: 'integer', nullable: true })
    public monetaryValue?: number;
    @Column({ name: 'status', type: 'varchar' })
    public status!: string;
    @Column({ name: 'status_id', type: 'bigint', transformer: numberToBigIntTransformer })
    public statusId!: number;
    @Column({ name: 'title', type: 'varchar', nullable: true })
    public title?: string;

    @Index()
    @Column({ name: 'date_created', type: 'bigint', transformer: numberToBigIntTransformer })
    public dateCreated!: number;
    @PrimaryColumn({ name: 'date_modified', type: 'bigint', transformer: numberToBigIntTransformer })
    public dateModified!: number;
}
