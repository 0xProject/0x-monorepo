import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const table = new Table({
    name: 'raw.etherscan_transactions',
    columns: [
        { name: 'hash', type: 'varchar', isPrimary: true },

        { name: 'block_number', type: 'numeric', isNullable: false },
        { name: 'timestamp', type: 'numeric', isNullable: false },
        { name: 'block_hash', type: 'varchar', isNullable: false },
        { name: 'transaction_index', type: 'numeric', isNullable: false },
        { name: 'nonce', type: 'numeric', isNullable: false },
        { name: 'from', type: 'varchar', isNullable: false },
        { name: 'to', type: 'varchar', isNullable: false },
        { name: 'value', type: 'numeric', isNullable: false },
        { name: 'gas', type: 'numeric', isNullable: false },
        { name: 'gas_price', type: 'numeric', isNullable: false },
        { name: 'is_error', type: 'boolean', isNullable: false },
        { name: 'txreceipt_status', type: 'varchar', isNullable: true },
        { name: 'input', type: 'varchar', isNullable: false },
        { name: 'contract_address', type: 'varchar', isNullable: false },
        { name: 'cumulative_gas_used', type: 'numeric', isNullable: false },
        { name: 'gas_used', type: 'numeric', isNullable: false },
        { name: 'confirmations', type: 'numeric', isNullable: false },
    ],
});

export class CreateEtherscanTransactions1550749543417 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createTable(table);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable(table);
    }
}
