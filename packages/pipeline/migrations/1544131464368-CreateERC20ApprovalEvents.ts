import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const erc20ApprovalEvents = new Table({
    name: 'raw.erc20_approval_events',
    columns: [
        { name: 'token_address', type: 'varchar(42)', isPrimary: true },
        { name: 'log_index', type: 'integer', isPrimary: true },
        { name: 'block_number', type: 'bigint', isPrimary: true },

        { name: 'raw_data', type: 'varchar' },
        { name: 'transaction_hash', type: 'varchar' },
        { name: 'owner_address', type: 'varchar(42)' },
        { name: 'spender_address', type: 'varchar(42)' },
        { name: 'amount', type: 'numeric' },
    ],
});

export class CreateERC20TokenApprovalEvents1544131464368 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createTable(erc20ApprovalEvents);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable(erc20ApprovalEvents);
    }
}
