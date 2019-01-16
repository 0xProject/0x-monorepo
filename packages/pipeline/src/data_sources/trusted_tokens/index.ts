import { fetchSuccessfullyOrThrowAsync } from '../../utils';

export interface ZeroExTrustedTokenMeta {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
}

export type ZeroExTrustedTokens = ZeroExTrustedTokenMeta[];

export interface MetamaskTrustedTokenMeta {
    address: string;
    name: string;
    erc20: boolean;
    symbol: string;
    decimals: number;
}

export interface MetamaskTrustedTokens {
    [contractAddress: string]: MetamaskTrustedTokenMeta;
}

/**
 * Get the tokens trusted by 0x from the given url.
 */
export async function getZeroExTrustedTokensAsync(url: string): Promise<ZeroExTrustedTokens> {
    return fetchSuccessfullyOrThrowAsync(url);
}

/**
 * Get tokens trusted by Metamask from the given url.
 */
export async function getMetamaskTrustedTokensAsync(url: string): Promise<MetamaskTrustedTokens> {
    return fetchSuccessfullyOrThrowAsync(url);
}
