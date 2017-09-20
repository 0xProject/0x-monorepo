export const zeroExConfigSchema = {
    id: '/ZeroExConfig',
    properties: {
        gasPrice: {$ref: '/Number'},
        exchangeContractAddress: {$ref: '/Address'},
        tokenRegistryContractAddress: {$ref: '/Address'},
        etherTokenContractAddress: {$ref: '/Address'},
    },
    type: 'object',
};
