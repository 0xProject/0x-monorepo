import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

import { numberToBigIntTransformer } from '../utils';

@Entity({ name: 'copper_activities', schema: 'raw' })
export class CopperActivity {
    @PrimaryColumn({ type: 'bigint', transformer: numberToBigIntTransformer })
    public id!: number;

    @Index()
    @Column({ name: 'parent_id', type: 'bigint', transformer: numberToBigIntTransformer })
    public parentId!: number;
    @Column({ name: 'parent_type', type: 'varchar' })
    public parentType!: string;

    // join with CopperActivityType
    @Index()
    @Column({ name: 'type_id', type: 'bigint', transformer: numberToBigIntTransformer })
    public typeId!: number;
    @Column({ name: 'type_category', type: 'varchar' })
    public typeCategory!: string;
    @Column({ name: 'type_name', type: 'varchar', nullable: true })
    public typeName?: string;

    @Column({ name: 'user_id', type: 'bigint', transformer: numberToBigIntTransformer })
    public userId!: number;
    @Column({ name: 'old_value_id', type: 'bigint', nullable: true, transformer: numberToBigIntTransformer })
    public oldValueId?: number;
    @Column({ name: 'old_value_name', type: 'varchar', nullable: true })
    public oldValueName?: string;
    @Column({ name: 'new_value_id', type: 'bigint', nullable: true, transformer: numberToBigIntTransformer })
    public newValueId?: number;
    @Column({ name: 'new_value_name', type: 'varchar', nullable: true })
    public newValueName?: string;

    @Index()
    @Column({ name: 'date_created', type: 'bigint', transformer: numberToBigIntTransformer })
    public dateCreated!: number;
    @PrimaryColumn({ name: 'date_modified', type: 'bigint', transformer: numberToBigIntTransformer })
    public dateModified!: number;
}
