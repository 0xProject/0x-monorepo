export const assetPairsRequestOptsSchema = {
    id: '/AssetPairsRequestOpts',
    type: 'object',
    properties: {
        assetDataA: { $ref: '/Address' },
        assetDataB: { $ref: '/Address' },
    },
};
