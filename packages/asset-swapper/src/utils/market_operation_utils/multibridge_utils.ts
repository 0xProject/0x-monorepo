import { NULL_ADDRESS } from './constants';

// tslint:disable completed-docs

export const TOKENS = {
    WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
};

export function getMultiBridgeIntermediateToken(takerToken: string, makerToken: string): string {
    let intermediateToken = NULL_ADDRESS;
    if (takerToken !== TOKENS.WETH && makerToken !== TOKENS.WETH) {
        intermediateToken = TOKENS.WETH;
    } else if (takerToken === TOKENS.USDC || makerToken === TOKENS.USDC) {
        intermediateToken = TOKENS.DAI;
    }
    return intermediateToken;
}
