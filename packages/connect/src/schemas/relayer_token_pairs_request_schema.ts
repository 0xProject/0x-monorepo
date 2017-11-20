export const relayerTokenPairsRequestSchema = {
    id: '/RelayerTokenPairsRequest',
    type: 'object',
    properties: {
        tokenA: {$ref: '/Address'},
        tokenB: {$ref: '/Address'},
    },
};
