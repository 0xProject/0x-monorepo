export const orderBookRequestSchema = {
    id: '/OrderBookRequest',
    type: 'object',
    properties: {
        baseTokenAddress: { $ref: '/Address' },
        quoteTokenAddress: { $ref: '/Address' },
    },
    required: ['baseTokenAddress', 'quoteTokenAddress'],
};
