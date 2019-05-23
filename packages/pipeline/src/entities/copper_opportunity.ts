import { Column, Entity, PrimaryColumn } from 'typeorm';

import { numberToBigIntTransformer } from '../utils';

@Entity({ name: 'copper_opportunities', schema: 'raw' })
export class CopperOpportunity {
    @PrimaryColumn({ name: 'id', type: 'bigint', transformer: numberToBigIntTransformer })
    public id!: number;
    @Column({ name: 'name', type: 'varchar' })
    public name!: string;
    @Column({ name: 'assignee_id', nullable: true, type: 'bigint', transformer: numberToBigIntTransformer })
    public assigneeId?: number;
    @Column({ name: 'close_date', nullable: true, type: 'varchar' })
    public closeDate?: string;
    @Column({ name: 'company_id', nullable: true, type: 'bigint', transformer: numberToBigIntTransformer })
    public companyId?: number;
    @Column({ name: 'company_name', nullable: true, type: 'varchar' })
    public companyName?: string;
    @Column({ name: 'customer_source_id', nullable: true, type: 'bigint', transformer: numberToBigIntTransformer })
    public customerSourceId?: number;
    @Column({ name: 'loss_reason_id', nullable: true, type: 'bigint', transformer: numberToBigIntTransformer })
    public lossReasonId?: number;
    @Column({ name: 'pipeline_id', type: 'bigint', transformer: numberToBigIntTransformer })
    public pipelineId!: number;
    @Column({ name: 'pipeline_stage_id', type: 'bigint', transformer: numberToBigIntTransformer })
    public pipelineStageId!: number;
    @Column({ name: 'primary_contact_id', nullable: true, type: 'bigint', transformer: numberToBigIntTransformer })
    public primaryContactId?: number;
    @Column({ name: 'priority', nullable: true, type: 'varchar' })
    public priority?: string;
    @Column({ name: 'status', type: 'varchar' })
    public status!: string;
    @Column({ name: 'interaction_count', type: 'bigint', transformer: numberToBigIntTransformer })
    public interactionCount!: number;
    @Column({ name: 'monetary_value', nullable: true, type: 'integer' })
    public monetaryValue?: number;
    @Column({ name: 'win_probability', nullable: true, type: 'integer' })
    public winProbability?: number;
    @Column({ name: 'date_created', type: 'bigint', transformer: numberToBigIntTransformer })
    public dateCreated!: number;
    @PrimaryColumn({ name: 'date_modified', type: 'bigint', transformer: numberToBigIntTransformer })
    public dateModified!: number;
    @Column({ name: 'custom_fields', type: 'jsonb' })
    public customFields!: { [key: number]: number };
}
