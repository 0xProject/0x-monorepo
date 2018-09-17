const order = {
    tableName: 'orders',
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
const logToOrderSchemaMapping: any = {
    exchangeContractAddress: 'exchange_contract_address',
    maker: 'maker',
    makerTokenAddress: 'maker_token',
    makerTokenAmount: 'maker_amount',
    makerFee: 'maker_fee',
    taker: 'taker',
    takerTokenAddress: 'taker_token',
    takerTokenAmount: 'taker_amount',
    takerFee: 'taker_fee',
    expirationUnixTimestampSec: 'expiration_unix_timestamp_sec',
    salt: 'salt',
};
export { order, logToOrderSchemaMapping };
