import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const table = new Table({
    name: 'raw.github_issue',
    columns: [
        { name: 'observed_timestamp', type: 'numeric', isPrimary: true },
        { name: 'repo_full_name', type: 'varchar', isPrimary: true },
        { name: 'issue_number', type: 'numeric', isPrimary: true },

        { name: 'title', type: 'varchar', isNullable: false },
        { name: 'state', type: 'varchar', isNullable: false },
        { name: 'locked', type: 'boolean', isNullable: false },
        { name: 'user_login', type: 'varchar', isNullable: false },
        { name: 'user_type', type: 'varchar', isNullable: false },
        { name: 'user_site_admin', type: 'boolean', isNullable: false },
        { name: 'assignee_login', type: 'varchar', isNullable: true },
        { name: 'comments', type: 'numeric', isNullable: false },

        { name: 'created_at', type: 'numeric', isNullable: false },
        { name: 'updated_at', type: 'numeric', isNullable: false },
        { name: 'closed_at', type: 'numeric', isNullable: true },
    ],
});

export class CreateGithubIssue1552457956065 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createTable(table);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable(table);
    }
}
