export const event = {
    'tableName': 'events',
    'tableProperties': {
        'timestamp' : {
            'type': 'timestamp'
        },
        'id': {
            'type': 'key'
        },
        'event_type': { 
            'type': 'varchar',
            'required': true
        },
        'error_id': { 
            'type': 'varchar',
        },
        'order_hash': {
            'type' : 'char(66)'
        },
        'maker': {
            'type' : 'char(42)'
        },
        'maker_amount' : {
            'type' : 'varchar'
        }, 
        'maker_fee' : {
            'type' : 'varchar'
        },
        'maker_token' : {
            'type' : 'char(42)'
        },
        'taker_amount' : {
            'type' : 'varchar'
        },
        'taker_fee' : {
            'type' : 'varchar'
        },
        'taker_token' : {
            'type' : 'char(42)'
        },
        'txn_hash' : {
            'type' : 'char(66)'
        },
        'gas_used' : {
            'type' : 'varchar'
        },
        'gas_price' : {
            'type' : 'varchar'
        }
        fee_recipient CHAR(42),
        method_id CHAR(10),
        salt VARCHAR,
        block_number BIGINT,

    }
}