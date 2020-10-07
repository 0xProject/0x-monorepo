import { BigNumber } from './configured_bignumber';

const MAX_DIGITS_IN_UNSIGNED_256_INT = 78;

/**
 * Generates a pseudo-random 256-bit number.
 * @return  A pseudo-random 256-bit number.
 */
export function generatePseudoRandom256BitNumber(): BigNumber {
    // BigNumber.random returns a pseudo-random number between 0 & 1 with a passed in number of decimal places.
    // Source: https://mikemcl.github.io/bignumber.js/#random
    const randomNumber = BigNumber.random(MAX_DIGITS_IN_UNSIGNED_256_INT);
    const factor = new BigNumber(10).pow(MAX_DIGITS_IN_UNSIGNED_256_INT - 1);
    const randomNumberScaledTo256Bits = randomNumber.times(factor).integerValue();
    return randomNumberScaledTo256Bits;
}
