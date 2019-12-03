import { hexRandom } from '@0x/utils';

import { constants } from './constants';

/**
 * Generates a random address.
 */
export function randomAddress(): string {
    return hexRandom(constants.ADDRESS_LENGTH);
}
