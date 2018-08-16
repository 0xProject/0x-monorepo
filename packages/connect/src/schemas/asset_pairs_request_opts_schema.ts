export const assetPairsRequestOptsSchema = {
    id: '/AssetPairsRequestOpts',
    type: 'object',
    properties: {
        assetDataA: { $ref: '/hexSchema' },
        assetDataB: { $ref: '/hexSchema' },
    },
};
