export const relayerApiAssetDataPairsResponseSchema = {
    id: '/RelayerApiAssetDataPairsResponse',
    type: 'object',
    allOf: [
        { $ref: '/PaginatedCollection' },
        {
            properties: {
                records: { $ref: '/RelayerApiAssetDataPairs' },
            },
            required: ['records'],
        },
    ],
};

export const relayerApiAssetDataPairsSchema = {
    id: '/RelayerApiAssetDataPairs',
    type: 'array',
    items: {
        properties: {
            assetDataA: { $ref: '/RelayerApiAssetDataTradeInfo' },
            assetDataB: { $ref: '/RelayerApiAssetDataTradeInfo' },
        },
        required: ['assetDataA', 'assetDataB'],
        type: 'object',
    },
};

export const relayerApiAssetDataTradeInfoSchema = {
    id: '/RelayerApiAssetDataTradeInfo',
    type: 'object',
    properties: {
        assetData: { $ref: '/Hex' },
        minAmount: { $ref: '/Number' },
        maxAmount: { $ref: '/Number' },
        precision: { type: 'number' },
    },
    required: ['assetData'],
};
