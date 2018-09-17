const historicalPrices = {
    tableName: 'historical_prices',
    tableProperties: {
        token: {
            type: 'varchar',
        },
        base: {
            type: 'varchar',
        },
        timestamp: {
            type: 'timestamp',
        },
        close: {
            type: 'numeric(50)',
        },
        high: {
            type: 'numeric(50)',
        },
        low: {
            type: 'numeric(50)',
        },
        open: {
            type: 'numeric(50)',
        },
        volume_from: {
            type: 'numeric(50)',
        },
        volume_to: {
            type: 'numeric(50)',
        },
    },
};
const logToHistoricalPricesSchema: { [log: string]: string } = {
    token: 'token',
    time: 'timestamp',
    close: 'close',
    high: 'high',
    low: 'low',
    open: 'open',
    volumefrom: 'volume_from',
    volumeto: 'volume_to',
};
export { historicalPrices, logToHistoricalPricesSchema };
