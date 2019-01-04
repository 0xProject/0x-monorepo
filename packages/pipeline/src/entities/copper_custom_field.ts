import { Column, Entity, PrimaryColumn } from 'typeorm';

import { numberToBigIntTransformer } from '../utils';

@Entity({ name: 'copper_custom_fields', schema: 'raw' })
export class CopperCustomField {
    @PrimaryColumn({ type: 'bigint', transformer: numberToBigIntTransformer })
    public id!: number;
    @Column({ name: 'data_type', type: 'varchar' })
    public dataType!: string;
    @Column({ name: 'field_type', type: 'varchar', nullable: true })
    public fieldType?: string;
    @Column({ name: 'name', type: 'varchar' })
    public name!: string;
}
