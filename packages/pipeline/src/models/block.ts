const block = {
    tableName: 'blocks',
    tableProperties: {
        id: {
            type: 'key',
        },
        timestamp: {
            type: 'timestamp',
            required: true,
        },
        block_number: {
            type: 'bigint',
            required: true,
        },
    },
};
const logToBlockSchemaMapping: any = {
    number: 'block_number',
    hash: 'block_hash',
    timestamp: 'timestamp',
};
export { block, logToBlockSchemaMapping };
