export const contractWrappersPrivateNetworkConfigSchema = {
    id: '/ZeroExContractPrivateNetworkConfig',
    properties: {
        networkId: {
            type: 'number',
            minimum: 1,
        },
        gasPrice: { $ref: '/Number' },
        zrxContractAddress: { $ref: '/Address' },
        exchangeContractAddress: { $ref: '/Address' },
        erc20ProxyContractAddress: { $ref: '/Address' },
        erc721ProxyContractAddress: { $ref: '/Address' },
        blockPollingIntervalMs: { type: 'number' },
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
    required: [
        'networkId',
        'zrxContractAddress',
        'exchangeContractAddress',
        'erc20ProxyContractAddress',
        'erc721ProxyContractAddress',
    ],
};
