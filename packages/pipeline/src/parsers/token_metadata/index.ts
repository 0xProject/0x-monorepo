import * as R from 'ramda';

import {
    MetamaskTrustedTokenMeta,
    MetamaskTrustedTokens,
    ZeroExTrustedTokenMeta,
    ZeroExTrustedTokens,
} from '../../data_sources/trusted_tokens';
import { TokenMetadata } from '../../entities';
import { toBigNumberOrNull } from '../../utils';

/**
 * Parses Metamask's trusted tokens list.
 * @param rawResp raw response from the metamask json file.
 */
export function parseMetamaskTrustedTokens(rawResp: MetamaskTrustedTokens): TokenMetadata[] {
    const parsedAsObject = R.mapObjIndexed(parseMetamaskTrustedToken, rawResp);
    return R.values(parsedAsObject);
}

/**
 * Parses 0x's trusted tokens list.
 * @param rawResp raw response from the 0x trusted tokens file.
 */
export function parseZeroExTrustedTokens(rawResp: ZeroExTrustedTokens): TokenMetadata[] {
    return R.map(parseZeroExTrustedToken, rawResp);
}

function parseMetamaskTrustedToken(resp: MetamaskTrustedTokenMeta, address: string): TokenMetadata {
    const trustedToken = new TokenMetadata();

    trustedToken.address = address;
    trustedToken.decimals = toBigNumberOrNull(resp.decimals);
    trustedToken.symbol = resp.symbol;
    trustedToken.name = resp.name;
    trustedToken.authority = 'metamask';

    return trustedToken;
}

function parseZeroExTrustedToken(resp: ZeroExTrustedTokenMeta): TokenMetadata {
    const trustedToken = new TokenMetadata();

    trustedToken.address = resp.address;
    trustedToken.decimals = toBigNumberOrNull(resp.decimals);
    trustedToken.symbol = resp.symbol;
    trustedToken.name = resp.name;
    trustedToken.authority = '0x';

    return trustedToken;
}
