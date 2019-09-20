import { constants } from './constants';
import { hexRandom } from './hex_utils';

/**
 * Generates a random address.
 */
export function randomAddress(): string {
    return hexRandom(constants.ADDRESS_LENGTH);
}
