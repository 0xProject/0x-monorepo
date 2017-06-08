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
        'maker', 'taker', 'makerFee', 'takerFee', 'makerTokenAmount', 'takerTokenAmount',
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
