import * as ethUtil from 'ethereumjs-util';

/**
 * Concatenate all arguments as a hex string.
 */
export function hexConcat(...args: Array<string | number | Buffer>): string {
    return ethUtil.bufferToHex(Buffer.concat(args.map(h => ethUtil.toBuffer(h))));
}
