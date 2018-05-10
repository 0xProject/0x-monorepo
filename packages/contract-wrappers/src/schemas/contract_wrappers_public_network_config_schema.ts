export const contractWrappersPublicNetworkConfigSchema = {
    id: '/ZeroExContractPublicNetworkConfig',
    properties: {
        networkId: {
            type: 'number',
            enum: [1, 3, 4, 42, 50],
        },
        gasPrice: { $ref: '/Number' },
        zrxContractAddress: { $ref: '/Address' },
        exchangeContractAddress: { $ref: '/Address' },
        tokenRegistryContractAddress: { $ref: '/Address' },
        tokenTransferProxyContractAddress: { $ref: '/Address' },
        orderWatcherConfig: {
            type: 'object',
            properties: {
                pollingIntervalMs: {
                    type: 'number',
                    minimum: 0,
                },
                numConfirmations: {
                    type: 'number',
                    minimum: 0,
                },
            },
        },
    },
    type: 'object',
    required: ['networkId'],
};
