export const AssetPairsRequestOptsSchema = {
    id: '/AssetPairsRequestOpts',
    type: 'object',
    properties: {
        assetDataA: { $ref: '/Address' },
        assetDataB: { $ref: '/Address' },
    },
};
