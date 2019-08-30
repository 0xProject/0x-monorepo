import { expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { Decimal } from 'decimal.js';

Decimal.set({ precision: 80 });

export type Numberish = BigNumber | string | number;

/**
 * Converts two decimal numbers to integers with `precision` digits, then returns
 * the absolute difference.
 */
export function getNumericalDivergence(a: Numberish, b: Numberish, precision: number = 18): number {
    const _toInteger = (n: Numberish) => {
        const _n = new BigNumber(n);
        const integerDigits = _n.integerValue().sd(true);
        const base = 10 ** (precision - integerDigits);
        return _n.times(base).integerValue(BigNumber.ROUND_DOWN);
    };
    return _toInteger(a)
        .minus(_toInteger(b))
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
