export const relayerApiOrderConfigPayloadSchema = {
    id: '/RelayerApiOrderConfigPayload',
    type: 'object',
    properties: {
        makerAddress: { $ref: '/Address' },
        takerAddress: { $ref: '/Address' },
        makerAssetAmount: { $ref: '/Number' },
        takerAssetAmount: { $ref: '/Number' },
        makerAssetData: { $ref: '/Hex' },
        takerAssetData: { $ref: '/Hex' },
        exchangeAddress: { $ref: '/Address' },
        expirationTimeSeconds: { $ref: '/Number' },
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
