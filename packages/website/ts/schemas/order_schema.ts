export const orderSchema = {
    id: '/Order',
    properties: {
        maker: { $ref: '/OrderTaker' },
        taker: { $ref: '/OrderTaker' },
        salt: { type: 'string' },
        ecSignature: { $ref: '/SignatureData' },
        expirationUnixTimestampSec: { type: 'string' },
        feeRecipient: { type: 'string' },
        exchangeContractAddress: { type: 'string' },
        networkId: { type: 'number' },
    },
    required: [
        'maker',
        'taker',
        'salt',
        'ecSignature',
        'expirationUnixTimestampSec',
        'feeRecipient',
        'exchangeContractAddress',
        'networkId',
    ],
    type: 'object',
};
