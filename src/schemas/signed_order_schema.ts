export const addressSchema = {
    id: '/addressSchema',
    type: 'string',
    pattern: '^0[xX][0-9A-Fa-f]{40}$',
};

export const bigNumberSchema = {
    id: '/bigNumberSchema',
    type: 'string',
    pattern: '^\d*$',
};

export const orderSchema = {
    id: '/orderSchema',
    properties: {
        maker: {$ref: '/addressSchema'},
        taker: {$ref: '/addressSchema'},

        makerFee: {$ref: '/bigNumberSchema'},
        takerFee: {$ref: '/bigNumberSchema'},

        makerTokenAmount: {$ref: '/bigNumberSchema'},
        takerTokenAmount: {$ref: '/bigNumberSchema'},

        makerTokenAddress: {$ref: '/addressSchema'},
        takerTokenAddress: {$ref: '/addressSchema'},

        salt: {$ref: '/bigNumberSchema'},
        fillAmount: {$ref: '/bigNumberSchema'},
        feeRecipient: {$ref: '/addressSchema'},
        expirationUnixTimestampSec: {$ref: '/bigNumberSchema'},
    },
    required: [
        'maker', /*'taker',*/ 'makerFee', 'takerFee', 'makerTokenAmount', 'takerTokenAmount',
        'salt', 'fillAmount', 'feeRecipient', 'expirationUnixTimestampSec',
    ],
    type: 'object',
};

export const signedOrderSchema = {
    id: '/signedOrderSchema',
    allOf: [
        { $ref: '/orderSchema' },
        {
            properties: {
                ecSignature: {$ref: '/addressSchema'},
            },
            required: ['ecSignature'],
        },
    ],
};
