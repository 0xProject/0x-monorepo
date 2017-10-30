export const zeroExConfigSchema = {
    id: '/ZeroExConfig',
    properties: {
        gasPrice: {$ref: '/Number'},
        exchangeContractAddress: {$ref: '/Address'},
        tokenRegistryContractAddress: {$ref: '/Address'},
        etherTokenContractAddress: {$ref: '/Address'},
        mempoolPollingIntervalMs: {
            type: 'number',
            min: 0,
        },
    },
    type: 'object',
};
