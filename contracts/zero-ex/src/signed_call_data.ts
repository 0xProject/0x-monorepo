import { SignatureType } from '@0x/types';
import { hexUtils } from '@0x/utils';
import * as ethjs from 'ethereumjs-util';

/**
 * Generate calldata with a signature appended.
 */
export function signCallData(callData: string, privateKey: string): string {
    const prefix = ethjs.sha3('SignedCallDataSignature(bytes)').slice(0, 4);
    return hexUtils.concat(callData, prefix, generateCallDataSignature(callData, privateKey));
}

/**
 * Generate a signature for calldata.
 */
export function generateCallDataSignature(callData: string, privateKey: string): string {
    return generateCallDataHashSignature(hexUtils.hash(callData), privateKey);
}

/**
 * Generate a signature for calldata hash.
 */
export function generateCallDataHashSignature(callDataHash: string, privateKey: string): string {
    const { r, s, v } = ethjs.ecsign(
        ethjs.hashPersonalMessage(ethjs.toBuffer(callDataHash)),
        ethjs.toBuffer(privateKey),
    );
    return hexUtils.concat(v, r, s, SignatureType.EthSign);
}
