import { MAINNET_KYBER_RESERVE_IDS, MAINNET_KYBER_TOKEN_RESERVE_IDS } from './constants';

// tslint:disable completed-docs
export function getKyberReserveIdsForPair(takerToken: string, makerToken: string): string[] {
    return [
        ...Object.values(MAINNET_KYBER_RESERVE_IDS),
        MAINNET_KYBER_TOKEN_RESERVE_IDS[makerToken.toLowerCase()],
        MAINNET_KYBER_TOKEN_RESERVE_IDS[takerToken.toLowerCase()],
    ].filter(t => t);
}
