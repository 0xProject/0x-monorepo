import { MigrationInterface, QueryRunner } from 'typeorm';

const tableNames = ['exchange_cancel_events', 'exchange_cancel_up_to_events', 'exchange_fill_events'];

const oldPrimaryColumns = ['contract_address', 'log_index', 'block_number'];

const newPrimaryColumns = ['transaction_hash'];

async function updatePrimaryKeysAsync(queryRunner: QueryRunner, columnNames: string[]): Promise<void> {
    for (const tableName of tableNames) {
        const table = await queryRunner.getTable(`raw.${tableName}`);
        if (table === undefined) {
            throw new Error(`Couldn't get table 'raw.${tableName}'`);
        }
        const columns = [];
        for (const columnName of columnNames) {
            const column = table.findColumnByName(columnName);
            if (column === undefined) {
                throw new Error(`Couldn't get column '${columnName}' from table 'raw.${tableName}'`);
            }
            columns.push(column);
        }
        await queryRunner.updatePrimaryKeys(table, columns);
    }
}

export class AddTxHashToExchangeEventPrimaryKey1549479172800 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await updatePrimaryKeysAsync(queryRunner, oldPrimaryColumns.concat(newPrimaryColumns));
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await updatePrimaryKeysAsync(queryRunner, oldPrimaryColumns);
    }
}
