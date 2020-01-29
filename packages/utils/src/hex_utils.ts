import * as crypto from 'crypto';
import * as ethUtil from 'ethereumjs-util';

import { BigNumber } from './configured_bignumber';
import { Numberish } from './types';

// tslint:disable:custom-no-magic-numbers

const WORD_LENGTH = 32;
const WORD_CEIL = new BigNumber(2).pow(WORD_LENGTH * 8);

export const hexUtils = {
    concat,
    random,
    leftPad,
    rightPad,
    invert,
    slice,
    hash,
    size,
    toHex,
    isHex,
};

/**
 * Concatenate all arguments as a hex string.
 */
function concat(...args: Array<string | number | Buffer>): string {
    return ethUtil.bufferToHex(Buffer.concat(args.map(h => ethUtil.toBuffer(h))));
}

/**
 * Generate a random hex string.
 */
function random(_size: number = WORD_LENGTH): string {
    return ethUtil.bufferToHex(crypto.randomBytes(_size));
}

/**
 * Left-pad a hex number to a number of bytes.
 */
function leftPad(n: Numberish, _size: number = WORD_LENGTH): string {
    return ethUtil.bufferToHex(ethUtil.setLengthLeft(hexUtils.toHex(n), _size));
}

/**
 * Right-pad a hex number to a number of bytes.
 */
function rightPad(n: Numberish, _size: number = WORD_LENGTH): string {
    return ethUtil.bufferToHex(ethUtil.setLengthRight(hexUtils.toHex(n), _size));
}

/**
 * Inverts a hex word.
 */
function invert(n: Numberish, _size: number = WORD_LENGTH): string {
    const buf = ethUtil.setLengthLeft(hexUtils.toHex(n), _size);
    // tslint:disable-next-line: no-bitwise
    return ethUtil.bufferToHex(Buffer.from(buf.map(b => ~b)));
}

/**
 * Slices a hex number.
 */
function slice(n: Numberish, start: number, end?: number): string {
    const hex = hexUtils.toHex(n).substr(2);
    const sliceStart = start >= 0 ? start * 2 : Math.max(0, hex.length + start * 2);
    let sliceEnd = hex.length;
    if (end !== undefined) {
        sliceEnd = end >= 0 ? end * 2 : Math.max(0, hex.length + end * 2);
    }
    return '0x'.concat(hex.substring(sliceStart, sliceEnd));
}

/**
 * Get the keccak hash of some data.
 */
function hash(n: Numberish): string {
    return ethUtil.bufferToHex(ethUtil.sha3(ethUtil.toBuffer(hexUtils.toHex(n))));
}

/**
 * Get the length, in bytes, of a hex string.
 */
function size(hex: string): number {
    return Math.ceil((hex.length - 2) / 2);
}

/**
 * Convert a string, a number, or a BigNumber into a hex string.
 * Works with negative numbers, as well.
 */
function toHex(n: Numberish, _size: number = WORD_LENGTH): string {
    if (typeof n === 'string' && /^0x[0-9a-f]+$/i.test(n)) {
        // Already a hex.
        return n;
    }
    let _n = new BigNumber(n);
    if (_n.isNegative()) {
        // Perform two's-complement.
        // prettier-ignore
        _n = new BigNumber(
            invert(
                toHex(_n.abs()),
                _size,
            ).substr(2),
            16,
        ).plus(1).mod(WORD_CEIL);
    }
    return `0x${_n.toString(16)}`;
}

/**
 * Check if a string is a hex string.
 */
function isHex(s: string): boolean {
    return /^0x[0-9a-f]+$/i.test(s);
}
