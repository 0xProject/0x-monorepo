import { BigNumber } from '@0x/utils';
import * as crypto from 'crypto';
import * as ethUtil from 'ethereumjs-util';

import { constants } from './constants';

const { WORD_LENGTH } = constants;

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
 */
export function toHex(n: string | BigNumber | number): string {
    let hex = '0x00';
    if (typeof(n) === 'number') {
        hex = `0x${n.toString(16)}`;
    } else if (BigNumber.isBigNumber(n)) {
        hex = `0x${n.toString(16)}`;
    } else {
        if (/^0x/.test(n)) {
            hex = n;
        } else {
            hex = `0x${parseInt(n, 10).toString(16)}`;
        }
    }
    return hex;
}
