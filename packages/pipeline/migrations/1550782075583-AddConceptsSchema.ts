import {MigrationInterface, QueryRunner} from "typeorm";

export class AddConceptsSchema1550782075583 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
       await queryRunner.query(`
            CREATE SCHEMA IF NOT EXISTS concepts;
       `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            DROP SCHEMA IF EXISTS concepts;
        `);
    }

}
