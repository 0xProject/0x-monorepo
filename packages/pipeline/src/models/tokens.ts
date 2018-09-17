const token = {
    tableName: 'tokens',
    tableProperties: {
        address: {
            type: 'char(66)',
        },
        decimals: {
            type: 'bigint',
        },
        name: {
            type: 'varchar',
        },
        symbol: {
            type: 'varchar',
        },
    },
};
const logToTokenSchemaMapping: any = {
    address: 'address',
    decimals: 'decimals',
    name: 'name',
    symbol: 'symbol',
};
export { token, logToTokenSchemaMapping };
