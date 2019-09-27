import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as crypto from 'crypto';

import { expect } from './chai_setup';
import { Numberish } from './types';

/**
 * Generate a random integer between `min` and `max`, inclusive.
 */
export function getRandomInteger(min: Numberish, max: Numberish): BigNumber {
    const range = new BigNumber(max).minus(min);
    return getRandomPortion(range).plus(min);
}

/**
 * Generate a random integer between `0` and `total`, inclusive.
 */
export function getRandomPortion(total: Numberish): BigNumber {
    return new BigNumber(total).times(getRandomFloat(0, 1)).integerValue(BigNumber.ROUND_HALF_UP);
}

/**
 * Generate a random, high-precision decimal between `min` and `max`, inclusive.
 */
export function getRandomFloat(min: Numberish, max: Numberish): BigNumber {
    // Generate a really high precision number between [0, 1]
    const r = new BigNumber(crypto.randomBytes(32).toString('hex'), 16).dividedBy(new BigNumber(2).pow(256).minus(1));
    return new BigNumber(max)
        .minus(min)
        .times(r)
        .plus(min);
}

/**
 * Converts two decimal numbers to integers with `precision` digits, then returns
 * the absolute difference.
 */
export function getNumericalDivergence(a: Numberish, b: Numberish, precision: number = 18): number {
    const _a = new BigNumber(a);
    const _b = new BigNumber(b);
    const maxIntegerDigits = Math.max(
        _a.integerValue(BigNumber.ROUND_DOWN).sd(true),
        _b.integerValue(BigNumber.ROUND_DOWN).sd(true),
    );
    const _toInteger = (n: BigNumber) => {
        const base = 10 ** (precision - maxIntegerDigits);
        return n.times(base).integerValue(BigNumber.ROUND_DOWN);
    };
    return _toInteger(_a)
        .minus(_toInteger(_b))
        .abs()
        .toNumber();
}

/**
 * Asserts that two numbers are equal up to `precision` digits.
 */
export function assertRoughlyEquals(actual: Numberish, expected: Numberish, precision: number = 18): void {
    if (getNumericalDivergence(actual, expected, precision) <= 1) {
        return;
    }
    expect(actual).to.bignumber.eq(expected);
}

/**
 * Asserts that two numbers are equal with up to `maxError` difference between them.
 */
export function assertIntegerRoughlyEquals(actual: Numberish, expected: Numberish, maxError: number = 1): void {
    const diff = new BigNumber(actual)
        .minus(expected)
        .abs()
        .toNumber();
    if (diff <= maxError) {
        return;
    }
    expect(actual).to.bignumber.eq(expected);
}

/**
 * Converts `amount` into a base unit amount with 18 digits.
 */
export function toBaseUnitAmount(amount: Numberish): BigNumber {
    const decimals = 18;
    const amountAsBigNumber = new BigNumber(amount);
    const baseUnitAmount = Web3Wrapper.toBaseUnitAmount(amountAsBigNumber, decimals);
    return baseUnitAmount;
}
