import * as _ from 'lodash';

import { InternalZeroExError, Token } from '../../src/types';

const PROTOCOL_TOKEN_SYMBOL = 'ZRX';
const WETH_TOKEN_SYMBOL = 'WETH';

export class TokenUtils {
    private _tokens: Token[];
    constructor(tokens: Token[]) {
        this._tokens = tokens;
    }
    public getProtocolTokenOrThrow(): Token {
        const zrxToken = _.find(this._tokens, { symbol: PROTOCOL_TOKEN_SYMBOL });
        if (_.isUndefined(zrxToken)) {
            throw new Error(InternalZeroExError.ZrxNotInTokenRegistry);
        }
        return zrxToken;
    }
    public getWethTokenOrThrow(): Token {
        const wethToken = _.find(this._tokens, { symbol: WETH_TOKEN_SYMBOL });
        if (_.isUndefined(wethToken)) {
            throw new Error(InternalZeroExError.WethNotInTokenRegistry);
        }
        return wethToken;
    }
    public getDummyTokens(): Token[] {
        const dummyTokens = _.filter(this._tokens, token => {
            return !_.includes([PROTOCOL_TOKEN_SYMBOL, WETH_TOKEN_SYMBOL], token.symbol);
        });
        return dummyTokens;
    }
}
