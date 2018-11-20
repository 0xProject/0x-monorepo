import * as R from 'ramda';

import { 
    ZeroExTrustedTokenMeta, 
    MetamaskTrustedTokenMeta, 
    TrustedTokenSource 
} from '../../data_sources/trusted_tokens';
import { TrustedTokens } from '../../entities';

/**
 * Parses Metamask's trusted tokens list.
 * @param rawResp raw response from the metamask json file.
 */
export function parseMetamaskTrustedTokens(rawResp: Map<string, MetamaskTrustedTokenMeta>): TrustedTokens[] {
    const parsedAsObject = R.mapObjIndexed(parseMetamaskTrustedToken, rawResp);
    return R.values(parsedAsObject);
}

export function parseZeroExTrustedTokens(rawResp: Array<ZeroExTrustedTokenMeta>): TrustedTokens[] {
    return R.map(parseZeroExTrustedToken, rawResp);
}

function parseMetamaskTrustedToken(resp: MetamaskTrustedTokenMeta, address: string): TrustedTokens {
    
    const trustedToken = new TrustedTokens();

    trustedToken.address = address;
    trustedToken.authority = 'metamask';

    return trustedToken;
}

function parseZeroExTrustedToken(resp: ZeroExTrustedTokenMeta): TrustedTokens {
    
    const trustedToken = new TrustedTokens();

    trustedToken.address = resp.address;
    trustedToken.authority = '0x';

    return trustedToken;
}