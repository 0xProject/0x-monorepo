export const orderSchema = {
    id: '/Order',
    properties: {
        makerAddress: { $ref: '/Address' },
        takerAddress: { $ref: '/Address' },
        makerFee: { $ref: '/Number' },
        takerFee: { $ref: '/Number' },
        senderAddress: { $ref: '/Address' },
        makerAssetAmount: { $ref: '/Number' },
        takerAssetAmount: { $ref: '/Number' },
        makerAssetData: { $ref: '/Hex' },
        takerAssetData: { $ref: '/Hex' },
        salt: { $ref: '/Number' },
        feeRecipientAddress: { $ref: '/Address' },
        expirationTimeSeconds: { $ref: '/Number' },
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
        'feeRecipientAddress',
        'expirationTimeSeconds',
    ],
    type: 'object',
};

export const signedOrderSchema = {
    id: '/SignedOrder',
    allOf: [
        { $ref: '/Order' },
        {
            properties: {
                signature: { $ref: '/Hex' },
            },
            required: ['signature'],
        },
    ],
};
