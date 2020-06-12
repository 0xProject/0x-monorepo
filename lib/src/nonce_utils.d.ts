import { Web3Wrapper } from '@0x/web3-wrapper';
/**
 * Fetch and RLP encode the transaction count (nonce) of an account.
 */
export declare function getRLPEncodedAccountNonceAsync(web3Wrapper: Web3Wrapper, address: string): Promise<string>;
/**
 * RLP encode the transaction count (nonce) of an account.
 */
export declare function rlpEncodeNonce(nonce: number): string;
//# sourceMappingURL=nonce_utils.d.ts.map