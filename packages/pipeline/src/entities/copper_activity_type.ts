import { Column, Entity, PrimaryColumn } from 'typeorm';

import { numberToBigIntTransformer } from '../utils';

@Entity({ name: 'copper_activity_types', schema: 'raw' })
export class CopperActivityType {
    @PrimaryColumn({ type: 'bigint', transformer: numberToBigIntTransformer })
    public id!: number;
    @Column({ name: 'category', type: 'varchar' })
    public category!: string;
    @Column({ name: 'name', type: 'varchar' })
    public name!: string;
    @Column({ name: 'is_disabled', type: 'boolean', nullable: true })
    public isDisabled?: boolean;
    @Column({ name: 'count_as_interaction', type: 'boolean', nullable: true })
    public countAsInteraction?: boolean;
}
