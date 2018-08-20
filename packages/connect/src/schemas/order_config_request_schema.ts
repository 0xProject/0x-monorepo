export const orderConfigRequestSchema = {
    id: '/OrderConfigRequest',
    type: 'object',
    properties: {
        makerAddress: { $ref: '/addressSchema' },
        takerAddress: { $ref: '/addressSchema' },
        makerAssetAmount: { $ref: '/numberSchema' },
        takerAssetAmount: { $ref: '/numberSchema' },
        makerAssetData: { $ref: '/hexSchema' },
        takerAssetData: { $ref: '/hexSchema' },
        exchangeAddress: { $ref: '/addressSchema' },
        expirationTimeSeconds: { $ref: '/numberSchema' },
    },
    required: [
        'makerAddress',
        'takerAddress',
        'makerAssetAmount',
        'takerAssetAmount',
        'makerAssetData',
        'takerAssetData',
        'exchangeAddress',
        'expirationTimeSeconds',
    ],
};
