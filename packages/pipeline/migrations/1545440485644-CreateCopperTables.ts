import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const leads = new Table({
    name: 'raw.copper_leads',
    columns: [
        { name: 'id', type: 'bigint', isPrimary: true },
        { name: 'name', type: 'varchar', isNullable: true },
        { name: 'first_name', type: 'varchar', isNullable: true },
        { name: 'last_name', type: 'varchar', isNullable: true },
        { name: 'middle_name', type: 'varchar', isNullable: true },
        { name: 'assignee_id', type: 'bigint', isNullable: true },
        { name: 'company_name', type: 'varchar', isNullable: true },
        { name: 'customer_source_id', type: 'bigint', isNullable: true },
        { name: 'monetary_value', type: 'integer', isNullable: true },
        { name: 'status', type: 'varchar' },
        { name: 'status_id', type: 'bigint' },
        { name: 'title', type: 'varchar', isNullable: true },
        { name: 'date_created', type: 'bigint' },
        { name: 'date_modified', type: 'bigint', isPrimary: true },
    ],
});
const activities = new Table({
    name: 'raw.copper_activities',
    columns: [
        { name: 'id', type: 'bigint', isPrimary: true },
        { name: 'parent_id', type: 'bigint' },
        { name: 'parent_type', type: 'varchar' },
        { name: 'type_id', type: 'bigint' },
        { name: 'type_category', type: 'varchar' },
        { name: 'type_name', type: 'varchar', isNullable: true },
        { name: 'user_id', type: 'bigint' },
        { name: 'old_value_id', type: 'bigint', isNullable: true },
        { name: 'old_value_name', type: 'varchar', isNullable: true },
        { name: 'new_value_id', type: 'bigint', isNullable: true },
        { name: 'new_value_name', type: 'varchar', isNullable: true },
        { name: 'date_created', type: 'bigint' },
        { name: 'date_modified', type: 'bigint', isPrimary: true },
    ],
});

const opportunities = new Table({
    name: 'raw.copper_opportunities',
    columns: [
        { name: 'id', type: 'bigint', isPrimary: true },
        { name: 'name', type: 'varchar' },
        { name: 'assignee_id', isNullable: true, type: 'bigint' },
        { name: 'close_date', isNullable: true, type: 'varchar' },
        { name: 'company_id', isNullable: true, type: 'bigint' },
        { name: 'company_name', isNullable: true, type: 'varchar' },
        { name: 'customer_source_id', isNullable: true, type: 'bigint' },
        { name: 'loss_reason_id', isNullable: true, type: 'bigint' },
        { name: 'pipeline_id', type: 'bigint' },
        { name: 'pipeline_stage_id', type: 'bigint' },
        { name: 'primary_contact_id', isNullable: true, type: 'bigint' },
        { name: 'priority', isNullable: true, type: 'varchar' },
        { name: 'status', type: 'varchar' },
        { name: 'interaction_count', type: 'bigint' },
        { name: 'monetary_value', isNullable: true, type: 'integer' },
        { name: 'win_probability', isNullable: true, type: 'integer' },
        { name: 'date_created', type: 'bigint' },
        { name: 'date_modified', type: 'bigint', isPrimary: true },
        { name: 'custom_fields', type: 'jsonb' },
    ],
});

const activityTypes = new Table({
    name: 'raw.copper_activity_types',
    columns: [
        { name: 'id', type: 'bigint', isPrimary: true },
        { name: 'category', type: 'varchar' },
        { name: 'name', type: 'varchar' },
        { name: 'is_disabled', type: 'boolean', isNullable: true },
        { name: 'count_as_interaction', type: 'boolean', isNullable: true },
    ],
});

const customFields = new Table({
    name: 'raw.copper_custom_fields',
    columns: [
        { name: 'id', type: 'bigint', isPrimary: true },
        { name: 'name', type: 'varchar' },
        { name: 'data_type', type: 'varchar' },
        { name: 'field_type', type: 'varchar', isNullable: true },
    ],
});

export class CreateCopperTables1544055699284 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createTable(leads);
        await queryRunner.createTable(activities);
        await queryRunner.createTable(opportunities);
        await queryRunner.createTable(activityTypes);
        await queryRunner.createTable(customFields);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable(leads.name);
        await queryRunner.dropTable(activities.name);
        await queryRunner.dropTable(opportunities.name);
        await queryRunner.dropTable(activityTypes.name);
        await queryRunner.dropTable(customFields.name);
    }
}
