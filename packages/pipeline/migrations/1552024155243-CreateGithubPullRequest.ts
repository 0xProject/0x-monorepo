import {MigrationInterface, QueryRunner, Table} from "typeorm";

const table = new Table({
    name: 'raw.github_pull_request',
    columns: [
        { name: 'observed_timestamp', type: 'numeric', isPrimary: true},
        { name: 'repo_name', type: 'varchar', isPrimary: true },
        { name: 'pull_request_number', type: 'numeric', isPrimary: true },

        { name: 'created_at', type: 'numeric', isNullable: false },
        { name: 'updated_at', type: 'numeric', isNullable: false },
        { name: 'closed_at', type: 'numeric', isNullable: true },
        { name: 'merged_at', type: 'numeric', isNullable: true },

        { name: 'state', type: 'varchar', isNullable: false },
        { name: 'title', type: 'varchar', isNullable: false },
        { name: 'user_login', type: 'varchar', isNullable: false },

    ],
});

export class CreateGithubPullRequest1552024155243 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createTable(table);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable(table);
    }

}
