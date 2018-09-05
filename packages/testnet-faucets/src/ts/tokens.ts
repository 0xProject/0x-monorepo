export const tokens = {
    ZRX: {
        name: '0x Protocol Token',
        decimals: 18,
        symbol: 'ZRX',
    },
    WETH: {
        name: 'Wrapped ETH',
        decimals: 18,
        symbol: 'WETH',
    },
};
export const ETHER_TOKEN = {
    name: 'Ether',
    decimals: 18,
    symbol: 'ETH',
};
export const TOKENS_BY_NETWORK: {
    [networkId: number]: { [tokenSymbol: string]: { address: string; decimals: number; symbol: string; name: string } };
} = {
    3: {
        ZRX: {
            ...tokens.ZRX,
            address: '0xff67881f8d12f372d91baae9752eb3631ff0ed00',
        },
        WETH: {
            ...tokens.WETH,
            address: '0xc778417e063141139fce010982780140aa0cd5ab',
        },
    },
    42: {
        ZRX: {
            ...tokens.ZRX,
            address: '0x2002d3812f58e35f0ea1ffbf80a75a38c32175fa',
        },
        WETH: {
            ...tokens.WETH,
            address: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
        },
    },
};
