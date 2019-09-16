import { constants } from './constants';
import { hexRandom } from './hex_utils';

export function randomAddress(): string {
    return hexRandom(constants.ADDRESS_LENGTH);
}
