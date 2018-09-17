const price = {
    tableName: 'prices',
    tableProperties: {
        address: {
            type: 'char(42)',
        },
        timestamp: {
            type: 'timestamp',
        },
        price: {
            type: 'numeric(50)',
        },
    },
};
export { price };
