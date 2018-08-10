export const orderSchema = {
    id: '/orderSchema',
    properties: {
        makerAddress: { $ref: '/addressSchema' },
        takerAddress: { $ref: '/addressSchema' },
        makerFee: { $ref: '/numberSchema' },
        takerFee: { $ref: '/numberSchema' },
        senderAddress: { $ref: '/addressSchema' },
        makerAssetAmount: { $ref: '/numberSchema' },
        takerAssetAmount: { $ref: '/numberSchema' },
        makerAssetData: { $ref: '/hexSchema' },
        takerAssetData: { $ref: '/hexSchema' },
        salt: { $ref: '/numberSchema' },
        exchangeAddress: { $ref: '/addressSchema' },
        feeRecipientAddress: { $ref: '/addressSchema' },
        expirationTimeSeconds: { $ref: '/numberSchema' },
    },
    required: [
        'makerAddress',
        'takerAddress',
        'makerFee',
        'takerFee',
        'senderAddress',
        'makerAssetAmount',
        'takerAssetAmount',
        'makerAssetData',
        'takerAssetData',
        'salt',
        'exchangeAddress',
        'feeRecipientAddress',
        'expirationTimeSeconds',
    ],
    type: 'object',
};

export const signedOrderSchema = {
    id: '/signedOrderSchema',
    allOf: [
        { $ref: '/orderSchema' },
        {
            properties: {
                signature: { $ref: '/hexSchema' },
            },
            required: ['signature'],
        },
    ],
};
