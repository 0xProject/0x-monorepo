import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const blocks = new Table({
    name: 'raw.blocks',
    columns: [
        { name: 'number', type: 'bigint', isPrimary: true },
        { name: 'hash', type: 'varchar', isPrimary: true },
        { name: 'timestamp', type: 'bigint' },
    ],
});

const exchange_cancel_events = new Table({
    name: 'raw.exchange_cancel_events',
    columns: [
        { name: 'contract_address', type: 'char(42)', isPrimary: true },
        { name: 'log_index', type: 'integer', isPrimary: true },
        { name: 'block_number', type: 'bigint', isPrimary: true },

        { name: 'raw_data', type: 'varchar' },

        { name: 'transaction_hash', type: 'varchar' },
        { name: 'maker_address', type: 'char(42)' },
        { name: 'taker_address', type: 'char(42)' },
        { name: 'fee_recipient_address', type: 'char(42)' },
        { name: 'sender_address', type: 'char(42)' },
        { name: 'order_hash', type: 'varchar' },

        { name: 'raw_maker_asset_data', type: 'varchar' },
        { name: 'maker_asset_type', type: 'varchar' },
        { name: 'maker_asset_proxy_id', type: 'varchar' },
        { name: 'maker_token_address', type: 'char(42)' },
        { name: 'maker_token_id', type: 'varchar', isNullable: true },
        { name: 'raw_taker_asset_data', type: 'varchar' },
        { name: 'taker_asset_type', type: 'varchar' },
        { name: 'taker_asset_proxy_id', type: 'varchar' },
        { name: 'taker_token_address', type: 'char(42)' },
        { name: 'taker_token_id', type: 'varchar', isNullable: true },
    ],
});

const exchange_cancel_up_to_events = new Table({
    name: 'raw.exchange_cancel_up_to_events',
    columns: [
        { name: 'contract_address', type: 'char(42)', isPrimary: true },
        { name: 'log_index', type: 'integer', isPrimary: true },
        { name: 'block_number', type: 'bigint', isPrimary: true },

        { name: 'raw_data', type: 'varchar' },

        { name: 'transaction_hash', type: 'varchar' },
        { name: 'maker_address', type: 'char(42)' },
        { name: 'sender_address', type: 'char(42)' },
        { name: 'order_epoch', type: 'varchar' },
    ],
});

const exchange_fill_events = new Table({
    name: 'raw.exchange_fill_events',
    columns: [
        { name: 'contract_address', type: 'char(42)', isPrimary: true },
        { name: 'log_index', type: 'integer', isPrimary: true },
        { name: 'block_number', type: 'bigint', isPrimary: true },

        { name: 'raw_data', type: 'varchar' },

        { name: 'transaction_hash', type: 'varchar' },
        { name: 'maker_address', type: 'char(42)' },
        { name: 'taker_address', type: 'char(42)' },
        { name: 'fee_recipient_address', type: 'char(42)' },
        { name: 'sender_address', type: 'char(42)' },
        { name: 'maker_asset_filled_amount', type: 'varchar' },
        { name: 'taker_asset_filled_amount', type: 'varchar' },
        { name: 'maker_fee_paid', type: 'varchar' },
        { name: 'taker_fee_paid', type: 'varchar' },
        { name: 'order_hash', type: 'varchar' },

        { name: 'raw_maker_asset_data', type: 'varchar' },
        { name: 'maker_asset_type', type: 'varchar' },
        { name: 'maker_asset_proxy_id', type: 'varchar' },
        { name: 'maker_token_address', type: 'char(42)' },
        { name: 'maker_token_id', type: 'varchar', isNullable: true },
        { name: 'raw_taker_asset_data', type: 'varchar' },
        { name: 'taker_asset_type', type: 'varchar' },
        { name: 'taker_asset_proxy_id', type: 'varchar' },
        { name: 'taker_token_address', type: 'char(42)' },
        { name: 'taker_token_id', type: 'varchar', isNullable: true },
    ],
});

const relayers = new Table({
    name: 'raw.relayers',
    columns: [
        { name: 'uuid', type: 'varchar', isPrimary: true },
        { name: 'name', type: 'varchar' },
        { name: 'sra_http_endpoint', type: 'varchar', isNullable: true },
        { name: 'sra_ws_endpoint', type: 'varchar', isNullable: true },
        { name: 'app_url', type: 'varchar', isNullable: true },
        { name: 'fee_recipient_addresses', type: 'char(42)', isArray: true },
        { name: 'taker_addresses', type: 'char(42)', isArray: true },
    ],
});

const sra_orders = new Table({
    name: 'raw.sra_orders',
    columns: [
        { name: 'exchange_address', type: 'char(42)', isPrimary: true },
        { name: 'order_hash_hex', type: 'varchar', isPrimary: true },

        { name: 'source_url', type: 'varchar' },
        { name: 'last_updated_timestamp', type: 'bigint' },
        { name: 'first_seen_timestamp', type: 'bigint' },

        { name: 'maker_address', type: 'char(42)' },
        { name: 'taker_address', type: 'char(42)' },
        { name: 'fee_recipient_address', type: 'char(42)' },
        { name: 'sender_address', type: 'char(42)' },
        { name: 'maker_asset_filled_amount', type: 'varchar' },
        { name: 'taker_asset_filled_amount', type: 'varchar' },
        { name: 'maker_fee', type: 'varchar' },
        { name: 'taker_fee', type: 'varchar' },
        { name: 'expiration_time_seconds', type: 'int' },
        { name: 'salt', type: 'varchar' },
        { name: 'signature', type: 'varchar' },

        { name: 'raw_maker_asset_data', type: 'varchar' },
        { name: 'maker_asset_type', type: 'varchar' },
        { name: 'maker_asset_proxy_id', type: 'varchar' },
        { name: 'maker_token_address', type: 'char(42)' },
        { name: 'maker_token_id', type: 'varchar', isNullable: true },
        { name: 'raw_taker_asset_data', type: 'varchar' },
        { name: 'taker_asset_type', type: 'varchar' },
        { name: 'taker_asset_proxy_id', type: 'varchar' },
        { name: 'taker_token_address', type: 'char(42)' },
        { name: 'taker_token_id', type: 'varchar', isNullable: true },

        { name: 'metadata_json', type: 'varchar' },
    ],
});

const token_on_chain_metadata = new Table({
    name: 'raw.token_on_chain_metadata',
    columns: [
        { name: 'address', type: 'char(42)', isPrimary: true },
        { name: 'decimals', type: 'integer' },
        { name: 'symbol', type: 'varchar' },
        { name: 'name', type: 'varchar' },
    ],
});

const transactions = new Table({
    name: 'raw.transactions',
    columns: [
        { name: 'block_number', type: 'bigint', isPrimary: true },
        { name: 'block_hash', type: 'varchar', isPrimary: true },
        { name: 'transaction_hash', type: 'varchar', isPrimary: true },
        { name: 'gas_used', type: 'bigint' },
        { name: 'gas_price', type: 'bigint' },
    ],
});

export class InitialSchema1542070840010 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createSchema('raw');

        await queryRunner.createTable(blocks);
        await queryRunner.createTable(exchange_cancel_events);
        await queryRunner.createTable(exchange_cancel_up_to_events);
        await queryRunner.createTable(exchange_fill_events);
        await queryRunner.createTable(relayers);
        await queryRunner.createTable(sra_orders);
        await queryRunner.createTable(token_on_chain_metadata);
        await queryRunner.createTable(transactions);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable(blocks.name);
        await queryRunner.dropTable(exchange_cancel_events.name);
        await queryRunner.dropTable(exchange_cancel_up_to_events.name);
        await queryRunner.dropTable(exchange_fill_events.name);
        await queryRunner.dropTable(relayers.name);
        await queryRunner.dropTable(sra_orders.name);
        await queryRunner.dropTable(token_on_chain_metadata.name);
        await queryRunner.dropTable(transactions.name);

        await queryRunner.dropSchema('raw');
    }
}
