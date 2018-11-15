import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddHomepageUrlToRelayers1542249766882 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.addColumn(
            'raw.relayers',
            new TableColumn({ name: 'homepage_url', type: 'varchar', default: `'unknown'` }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropColumn('raw.relayers', 'homepage_url');
    }
}
