import {MigrationInterface, QueryRunner, Table} from "typeorm";

const priceData = new Table({
    name: 'raw.exchange_observations',
    columns: [
        {name: 'id', type: 'bigint', isPrimary: true, isGenerated: true, generationStrategy: 'increment'},
        {name: 'timestamp', type: 'timestamp', isNullable: false},
        {name: 'exchange', type: 'varchar', isNullable: false},
        {name: 'base', type: 'varchar', isNullable: false},
        {name: 'quote', type: 'varchar', isNullable: false},
        {name: 'open', type: 'float', isNullable: true},
        {name: 'close', type: 'float', isNullable: true},
        {name: 'high', type: 'float', isNullable: true},
        {name: 'low', type: 'float', isNullable: true},
        {name: 'volume_from', type: 'float', isNullable: true},
        {name: 'volume_to', type: 'float', isNullable: true},
        {name: 'highest_bid', type: 'float', isNullable: true},
        {name: 'lowest_ask', type: 'float', isNullable: true},
        {name: 'other', type: 'json', isNullable: true},
    ]
})
    

export class AddPriceData1555629363562 implements MigrationInterface {


    public async up(queryRunner: QueryRunner): Promise<any> {
        return queryRunner.createTable(priceData)
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        return queryRunner.dropTable(priceData)
    }

}
