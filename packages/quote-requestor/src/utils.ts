export const getTokenInfo = (tokenName: string): [string, number] => {
    if (tokenName === 'USDC') {
        return ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6];
    }
    if (tokenName === 'WETH') {
        return ['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', 18];
    }
    throw new Error('Unknown token');
};
