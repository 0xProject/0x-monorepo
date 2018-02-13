export const tokenPairsRequestOptsSchema = {
    id: '/TokenPairsRequestOpts',
    type: 'object',
    properties: {
        tokenA: { $ref: '/Address' },
        tokenB: { $ref: '/Address' },
    },
};
