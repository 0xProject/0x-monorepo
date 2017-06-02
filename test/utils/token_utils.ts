import * as _ from 'lodash';
import {Token, ZeroExError} from '../../src/types';

const PROTOCOL_TOKEN_SYMBOL = 'ZRX';

export class TokenUtils {
    private tokens: Token[];
    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }
    public getProtocolTokenOrThrow(): Token {
        const zrxToken = _.find(this.tokens, {symbol: PROTOCOL_TOKEN_SYMBOL});
        if (_.isUndefined(zrxToken)) {
            throw new Error(ZeroExError.CONTRACT_NOT_DEPLOYED_ON_NETWORK);
        }
        return zrxToken;
    }
    public getNonProtocolTokens(): Token[] {
        return _.filter(this.tokens, token => {
            return token.symbol !== PROTOCOL_TOKEN_SYMBOL;
        });
    }
}
