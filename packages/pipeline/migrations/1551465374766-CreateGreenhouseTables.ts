import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

const applications = new Table({
    name: 'raw.greenhouse_applications',
    columns: [
        { name: 'id', type: 'bigint', isPrimary: true },
        { name: 'candidate_id', type: 'bigint' },
        { name: 'applied_at', type: 'timestamp' },
        { name: 'rejected_at', type: 'timestamp', isNullable: true },
        { name: 'last_activity_at', type: 'timestamp', isPrimary: true },
        { name: 'source_id', type: 'bigint', isNullable: true },
        { name: 'source_name', type: 'varchar', isNullable: true },
        { name: 'credited_to_id', type: 'bigint', isNullable: true },
        { name: 'credited_to_name', type: 'varchar', isNullable: true },
        { name: 'status', type: 'varchar' },
        { name: 'current_stage_id', type: 'bigint', isNullable: true },
        { name: 'current_stage_name', type: 'varchar', isNullable: true },
    ],
});

const applicationIndices = [
    new TableIndex({ columnNames: ['last_activity_at', 'current_stage_id'] }),
    new TableIndex({ columnNames: ['current_stage_id'] }),
    new TableIndex({ columnNames: ['candidate_id'] }),
    new TableIndex({ columnNames: ['credited_to_id'] }),
];

export class CreateGreenhouseTables1551465374766 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createTable(applications);
        await queryRunner.createIndices('raw.greenhouse_applications', applicationIndices);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropIndices('raw.greenhouse_applications', applicationIndices);
        await queryRunner.dropTable(applications);
    }
}
