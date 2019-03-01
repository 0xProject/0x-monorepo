import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

import { numberToBigIntTransformer } from '../utils';

@Entity({ name: 'greenhouse_applications', schema: 'raw' })
export class GreenhouseApplication {
    @Index()
    @PrimaryColumn({ type: 'bigint', transformer: numberToBigIntTransformer })
    public id!: number;

    @Index()
    @Column({ type: 'bigint', transformer: numberToBigIntTransformer })
    public candidate_id!: number;

    @Column({ type: 'timestamp' })
    public applied_at!: string;

    @Column({ type: 'timestamp' })
    public rejected_at?: string;

    @Index()
    @PrimaryColumn({ type: 'timestamp' })
    public last_activity_at!: string;

    @Column({ type: 'bigint', transformer: numberToBigIntTransformer })
    public source_id?: number;

    @Column({ type: 'varchar' })
    public source_name?: string;

    @Index()
    @Column({ type: 'bigint', transformer: numberToBigIntTransformer })
    public credited_to_id?: number;

    @Column({ type: 'varchar' })
    public credited_to_name?: string;

    @Column({ type: 'varchar' })
    public status!: string;

    @Index()
    @Column({ type: 'bigint', transformer: numberToBigIntTransformer })
    public current_stage_id?: number;

    @Column({ type: 'varchar' })
    public current_stage_name?: string;
}
