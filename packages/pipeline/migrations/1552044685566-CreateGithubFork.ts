import {MigrationInterface, QueryRunner, Table} from "typeorm";

const table = new Table({
    name: 'raw.github_fork',
    columns: [
        { name: 'observed_timestamp', type: 'numeric', isPrimary: true},
        { name: 'name', type: 'varchar', isPrimary: true },
        { name: 'owner_login', type: 'varchar', isPrimary: true },

        { name: 'created_at', type: 'numeric', isNullable: false },
        { name: 'updated_at', type: 'numeric', isNullable: false },
        { name: 'pushed_at', type: 'numeric', isNullable: false },

        { name: 'size', type: 'numeric', isNullable: false },
        { name: 'stargazers', type: 'numeric', isNullable: false },
        { name: 'watchers', type: 'numeric', isNullable: false },
        { name: 'forks', type: 'numeric', isNullable: false },
        { name: 'open_issues', type: 'numeric', isNullable: false },
        { name: 'network', type: 'numeric', isNullable: true },
        { name: 'subscribers', type: 'numeric', isNullable: true }        
    ],
});

export class CreateGithubFork1552044685566 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createTable(table);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable(table);
    }

}
