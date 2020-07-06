import { BigNumber } from '@0x/utils';
/**
 * Generates a pseudo-random 256-bit salt.
 * The salt can be included in a 0x order, ensuring that the order generates a unique orderHash
 * and will not collide with other outstanding orders that are identical in all other parameters.
 * @return  A pseudo-random 256-bit number that can be used as a salt.
 */
export declare function generatePseudoRandomSalt(): BigNumber;
//# sourceMappingURL=salt.d.ts.map