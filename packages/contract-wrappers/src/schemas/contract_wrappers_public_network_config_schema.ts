const networkNameToId: { [networkName: string]: number } = {
    mainnet: 1,
    ropsten: 3,
    rinkeby: 4,
    kovan: 42,
    ganache: 50,
};

export const contractWrappersPublicNetworkConfigSchema = {
    id: '/ZeroExContractPublicNetworkConfig',
    properties: {
        networkId: {
            type: 'number',
            enum: [
                networkNameToId.mainnet,
                networkNameToId.kovan,
                networkNameToId.ropsten,
                networkNameToId.rinkeby,
                networkNameToId.ganache,
            ],
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
    required: ['networkId'],
};
