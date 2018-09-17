const event = {
    tableName: 'events',
    tableProperties: {
        id: {
            type: 'key',
        },
        timestamp: {
            type: 'timestamp',
            required: true,
        },
        event_type: {
            type: 'varchar',
            required: true,
        },
        error_id: {
            type: 'varchar',
        },
        order_hash: {
            type: 'char(66)',
        },
        maker: {
            type: 'char(42)',
        },
        maker_amount: {
            type: 'varchar',
        },
        maker_fee: {
            type: 'varchar',
        },
        maker_token: {
            type: 'char(42)',
        },
        taker_amount: {
            type: 'varchar',
        },
        taker_fee: {
            type: 'varchar',
        },
        taker_token: {
            type: 'char(42)',
        },
        txn_hash: {
            type: 'char(66)',
        },
        gas_used: {
            type: 'varchar',
        },
        gas_price: {
            type: 'varchar',
        },
        fee_recipient: {
            type: 'char(42)',
        },
        method_id: {
            type: 'char(10)',
        },
        salt: {
            type: 'varchar',
        },
        block_number: {
            type: 'bigint',
        },
    },
};
const logToEventSchemaMapping: any = {
    blockNumber: 'block_number',
    transactionHash: 'txn_hash',
    event: 'event_type',
    logIndex: 'log_index',
    'args.maker': 'maker',
    'args.taker': 'taker',
    'args.feeRecipient': 'fee_recipient',
    'args.makerToken': 'maker_token',
    'args.takerToken': 'taker_token',
    'args.filledMakerTokenAmount': 'maker_amount',
    'args.filledTakerTokenAmount': 'taker_amount',
    'args.paidMakerFee': 'maker_fee',
    'args.paidTakerFee': 'taker_fee',
    'args.orderHash': 'order_hash',
    'args.cancelledMakerTokenAmount': 'maker_amount',
    'args.cancelledTakerTokenAmount': 'taker_amount',
    'args.errorId': 'error_id',
};
export { event, logToEventSchemaMapping };
