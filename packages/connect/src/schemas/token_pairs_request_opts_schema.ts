export const AssetPairsRequestOptsSchema = {
    id: '/AssetPairsRequestOpts',
    type: 'object',
    properties: {
        tokenA: { $ref: '/Address' },
        tokenB: { $ref: '/Address' },
    },
};
