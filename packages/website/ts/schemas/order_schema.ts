export const orderSchema = {
    id: '/Order',
    properties: {
        maker: { $ref: '/OrderTaker' },
        taker: { $ref: '/OrderTaker' },
        salt: { type: 'string' },
        signature: { $ref: '/SignatureData' },
        expirationUnixTimestampSec: { type: 'string' },
        feeRecipient: { type: 'string' },
        exchangeContract: { type: 'string' },
        networkId: { type: 'number' },
    },
    required: [
        'maker',
        'taker',
        'salt',
        'signature',
        'expirationUnixTimestampSec',
        'feeRecipient',
        'exchangeContract',
        'networkId',
    ],
    type: 'object',
};
