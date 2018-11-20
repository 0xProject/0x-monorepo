import * as R from 'ramda';

import { MetamaskTrustedTokenMeta, ZeroExTrustedTokenMeta } from '../../data_sources/trusted_tokens';
import { TrustedToken } from '../../entities';

/**
 * Parses Metamask's trusted tokens list.
 * @param rawResp raw response from the metamask json file.
 */
export function parseMetamaskTrustedTokens(rawResp: Map<string, MetamaskTrustedTokenMeta>): TrustedToken[] {
    const parsedAsObject = R.mapObjIndexed(parseMetamaskTrustedToken, rawResp);
    return R.values(parsedAsObject);
}

export function parseZeroExTrustedTokens(rawResp: ZeroExTrustedTokenMeta[]): TrustedToken[] {
    return R.map(parseZeroExTrustedToken, rawResp);
}

function parseMetamaskTrustedToken(resp: MetamaskTrustedTokenMeta, address: string): TrustedToken {

    const trustedToken = new TrustedToken();

    trustedToken.address = address;
    trustedToken.authority = 'metamask';

    return trustedToken;
}

function parseZeroExTrustedToken(resp: ZeroExTrustedTokenMeta): TrustedToken {

    const trustedToken = new TrustedToken();

    trustedToken.address = resp.address;
    trustedToken.authority = '0x';

    return trustedToken;
}
