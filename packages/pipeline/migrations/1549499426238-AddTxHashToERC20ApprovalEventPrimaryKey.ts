import { MigrationInterface, QueryRunner } from 'typeorm';

const oldPrimaryColumns = ['token_address', 'log_index', 'block_number'];

const newPrimaryColumns = ['transaction_hash'];

async function updatePrimaryKeysAsync(queryRunner: QueryRunner, columnNames: string[]): Promise<void> {
    const table = await queryRunner.getTable(`raw.erc20_approval_events`);
    if (table === undefined) {
        throw new Error(`Couldn't get table 'raw.erc20_approval_events'`);
    }
    const columns = [];
    for (const columnName of columnNames) {
        const column = table.findColumnByName(columnName);
        if (column === undefined) {
            throw new Error(`Couldn't get column '${columnName}' from table 'raw.erc20_approval_events'`);
        }
        columns.push(column);
    }
    await queryRunner.updatePrimaryKeys(table, columns);
}

export class AddTxHashToERC20ApprovalEventPrimaryKey1549499426238 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await updatePrimaryKeysAsync(queryRunner, oldPrimaryColumns.concat(newPrimaryColumns));
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await updatePrimaryKeysAsync(queryRunner, oldPrimaryColumns);
    }
}
