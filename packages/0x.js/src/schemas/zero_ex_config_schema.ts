export const zeroExConfigSchema = {
    id: '/ZeroExConfig',
    properties: {
        networkId: {
            type: 'number',
            minimum: 0,
        },
        gasPrice: { $ref: '/Number' },
        exchangeContractAddress: { $ref: '/Address' },
        tokenRegistryContractAddress: { $ref: '/Address' },
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
