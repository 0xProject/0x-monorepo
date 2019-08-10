import * as crypto from 'crypto';
import * as ethUtil from 'ethereumjs-util';

/**
 * Concatenate all arguments as a hex string.
 */
export function hexConcat(...args: Array<string | number | Buffer>): string {
    return ethUtil.bufferToHex(Buffer.concat(args.map(h => ethUtil.toBuffer(h))));
}
/**
 * Generate a random hex string.
 */
export function hexRandom(size: number = 32): string {
    return ethUtil.bufferToHex(crypto.randomBytes(size));
}
