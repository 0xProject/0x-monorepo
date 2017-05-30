export const addressSchema = {
    id: '/addressSchema',
    type: 'string',
    pattern: '^0[xX][0-9A-Fa-f]{40}$',
};

export const numberSchema = {
    id: '/numberSchema',
    type: 'string',
    format: '\d+(\.\d+)?',
};

export const orderSchema = {
    id: '/orderSchema',
    properties: {
        maker: {$ref: '/addressSchema'},
        taker: {$ref: '/addressSchema'},

        makerFee: {$ref: '/numberSchema'},
        takerFee: {$ref: '/numberSchema'},

        makerTokenAmount: {$ref: '/numberSchema'},
        takerTokenAmount: {$ref: '/numberSchema'},

        makerTokenAddress: {$ref: '/addressSchema'},
        takerTokenAddress: {$ref: '/addressSchema'},

        salt: {$ref: '/numberSchema'},
        feeRecipient: {$ref: '/addressSchema'},
        expirationUnixTimestampSec: {$ref: '/numberSchema'},
    },
    required: [
        'maker', /*'taker',*/ 'makerFee', 'takerFee', 'makerTokenAmount', 'takerTokenAmount',
        'salt', 'feeRecipient', 'expirationUnixTimestampSec',
    ],
    type: 'object',
};

export const signedOrderSchema = {
    id: '/signedOrderSchema',
    allOf: [
        { $ref: '/orderSchema' },
        {
            properties: {
                ecSignature: {$ref: '/ECSignature'},
            },
            required: ['ecSignature'],
        },
    ],
};
