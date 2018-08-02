export const relayerApiAssetDataPairsResponseSchema = {
    id: '/relayerApiAssetDataPairsResponseSchema',
    type: 'object',
    allOf: [
        { $ref: '/paginatedCollectionSchema' },
        {
            properties: {
                records: { $ref: '/relayerApiAssetDataPairsSchema' },
            },
            required: ['records'],
        },
    ],
};

export const relayerApiAssetDataPairsSchema = {
    id: '/relayerApiAssetDataPairsSchema',
    type: 'array',
    items: {
        properties: {
            assetDataA: { $ref: '/relayerApiAssetDataTradeInfoSchema' },
            assetDataB: { $ref: '/relayerApiAssetDataTradeInfoSchema' },
        },
        required: ['assetDataA', 'assetDataB'],
        type: 'object',
    },
};

export const relayerApiAssetDataTradeInfoSchema = {
    id: '/relayerApiAssetDataTradeInfoSchema',
    type: 'object',
    properties: {
        assetData: { $ref: '/hexSchema' },
        minAmount: { $ref: '/numberSchema' },
        maxAmount: { $ref: '/numberSchema' },
        precision: { type: 'number' },
    },
    required: ['assetData'],
};
