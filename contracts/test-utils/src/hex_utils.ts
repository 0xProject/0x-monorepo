import { BigNumber } from '@0x/utils';
import * as crypto from 'crypto';
import * as ethUtil from 'ethereumjs-util';

import { constants } from './constants';

const { WORD_LENGTH } = constants;
const WORD_CEIL = new BigNumber(2).pow(WORD_LENGTH * 8);

/**
 * Concatenate all arguments as a hex string.
 */
export function hexConcat(...args: Array<string | number | Buffer>): string {
    return ethUtil.bufferToHex(Buffer.concat(args.map(h => ethUtil.toBuffer(h))));
}

/**
 * Generate a random hex string.
 */
export function hexRandom(size: number = WORD_LENGTH): string {
    return ethUtil.bufferToHex(crypto.randomBytes(size));
}

/**
 * Left-pad a hex number to a number of bytes.
 */
export function hexLeftPad(n: string | BigNumber | number, size: number = WORD_LENGTH): string {
    return ethUtil.bufferToHex(ethUtil.setLengthLeft(toHex(n), size));
}

/**
 * Right-pad a hex number to a number of bytes.
 */
export function hexRightPad(n: string | BigNumber | number, size: number = WORD_LENGTH): string {
    return ethUtil.bufferToHex(ethUtil.setLengthRight(toHex(n), size));
}

/**
 * Inverts a hex word.
 */
export function hexInvert(n: string | BigNumber | number, size: number = WORD_LENGTH): string {
    const buf = ethUtil.setLengthLeft(toHex(n), size);
    // tslint:disable-next-line: no-bitwise
    return ethUtil.bufferToHex(Buffer.from(buf.map(b => ~b)));
}

/**
 * Convert a string, a number, or a BigNumber into a hex string.
 * Works with negative numbers, as well.
 */
export function toHex(n: string | BigNumber | number, size: number = WORD_LENGTH): string {
    if (typeof n === 'string' && /^0x[0-9a-f]+$/i.test(n)) {
        // Already a hex.
        return n;
    }
    let _n = new BigNumber(n);
    if (_n.isNegative()) {
        // Perform two's-complement.
        _n = new BigNumber(hexInvert(toHex(_n.abs()), size).substr(2), 16).plus(1).mod(WORD_CEIL);
    }
    return `0x${_n.toString(16)}`;
}
