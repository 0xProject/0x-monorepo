export const contractWrappersPrivateNetworkConfigSchema = {
    id: '/ZeroExContractPrivateNetworkConfig',
    properties: {
        networkId: {
            type: 'number',
            minimum: 1,
        },
        gasPrice: { $ref: '/numberSchema' },
        zrxContractAddress: { $ref: '/addressSchema' },
        exchangeContractAddress: { $ref: '/addressSchema' },
        erc20ProxyContractAddress: { $ref: '/addressSchema' },
        erc721ProxyContractAddress: { $ref: '/addressSchema' },
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
