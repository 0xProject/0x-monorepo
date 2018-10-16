export const ContractWrappersConfigSchema = {
    id: '/ContractWrappersConfig',
    properties: {
        networkId: {
            type: 'number',
        },
        gasPrice: { $ref: '/numberSchema' },
        contractAddresses: {
            type: 'object',
            properties: {
                erc20Proxy: { $ref: '/addressSchema' },
                erc721Proxy: { $ref: '/addressSchema' },
                zrxToken: { $ref: '/addressSchema' },
                etherToken: { $ref: '/addressSchema' },
                exchange: { $ref: '/addressSchema' },
                assetProxyOwner: { $ref: '/addressSchema' },
                forwarder: { $ref: '/addressSchema' },
                orderValidator: { $ref: '/addressSchema' },
            },
        },
        blockPollingIntervalMs: { type: 'number' },
    },
    type: 'object',
    required: ['networkId'],
};
