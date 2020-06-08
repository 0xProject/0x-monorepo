import { hexUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as ethjs from 'ethereumjs-util';

/**
 * Fetch and RLP encode the transaction count (nonce) of an account.
 */
export async function getRLPEncodedAccountNonceAsync(web3Wrapper: Web3Wrapper, address: string): Promise<string> {
    const nonce = await web3Wrapper.getAccountNonceAsync(address);
    return rlpEncodeNonce(nonce);
}

/**
 * RLP encode the transaction count (nonce) of an account.
 */
export function rlpEncodeNonce(nonce: number): string {
    if (nonce === 0) {
        return '0x80';
    } else if (nonce <= 0x7f) {
        return ethjs.bufferToHex(ethjs.toBuffer(nonce));
    } else {
        const rlpNonce = ethjs.toBuffer(nonce);
        return hexUtils.concat(rlpNonce.length + 0x80, ethjs.bufferToHex(rlpNonce));
    }
}
