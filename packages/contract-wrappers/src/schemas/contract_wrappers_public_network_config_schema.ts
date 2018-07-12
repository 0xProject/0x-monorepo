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
    required: ['networkId'],
};
