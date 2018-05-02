import { BigNumber } from '@0xproject/utils';

const MAX_DIGITS_IN_UNSIGNED_256_INT = 78;

/**
 * Generates a pseudo-random 256-bit salt.
 * The salt can be included in a 0x order, ensuring that the order generates a unique orderHash
 * and will not collide with other outstanding orders that are identical in all other parameters.
 * @return  A pseudo-random 256-bit number that can be used as a salt.
 */
export function generatePseudoRandomSalt(): BigNumber {
    // BigNumber.random returns a pseudo-random number between 0 & 1 with a passed in number of decimal places.
    // Source: https://mikemcl.github.io/bignumber.js/#random
    const randomNumber = BigNumber.random(MAX_DIGITS_IN_UNSIGNED_256_INT);
    const factor = new BigNumber(10).pow(MAX_DIGITS_IN_UNSIGNED_256_INT - 1);
    const salt = randomNumber.times(factor).round();
    return salt;
}
