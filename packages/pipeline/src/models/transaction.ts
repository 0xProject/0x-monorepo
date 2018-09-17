const transaction = {
    tableName: 'transactions',
    tableProperties: {
        txn_hash: {
            type: 'char(66)',
        },
        block_hash: {
            type: 'char(66)',
        },
        block_number: {
            type: 'bigint',
        },
        gas_used: {
            type: 'varchar',
        },
        gas_price: {
            type: 'varchar',
        },
        method_id: {
            type: 'char(10)',
        },
        salt: {
            type: 'varchar',
        },
    },
};
const logToTransactionSchemaMapping: any = {
    hash: 'txn_hash',
    gas: 'gas_used',
    gasPrice: 'gas_price',
    blockHash: 'block_hash',
    blockNumber: 'block_number',
    method_id: 'method_id',
    salt: 'salt',
};
export { transaction, logToTransactionSchemaMapping };
