interface TokensByNetwork {
    [networkId: number]: { [tokenSymbol: string]: { address: string; decimals: number } };
}

export const tokens = {
    ZRX: {
        decimals: 18,
    },
    WETH: {
        decimals: 18,
    },
};
export const TOKENS_BY_NETWORK: TokensByNetwork = {
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
    50: {
        ZRX: {
            ...tokens.ZRX,
            address: '0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c',
        },
        WETH: {
            ...tokens.WETH,
            address: '0x0b1ba0af832d7c05fd64161e0db78e85978e8082',
        },
    },
};
