export const orderBookRequestSchema = {
    id: '/OrderBookRequest',
    type: 'object',
    properties: {
        baseAssetData: { $ref: '/Address' },
        quoteAssetData: { $ref: '/Address' },
    },
    required: ['baseAssetData', 'quoteAssetData'],
};
