import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';

// Utility function to create a K:V from a list of strings
// Adapted from: https://basarat.gitbooks.io/typescript/content/docs/types/literal-types.html
function strEnum(values: string[]): {[key: string]: string} {
    return _.reduce(values, (result, key) => {
        result[key] = key;
        return result;
    }, Object.create(null));
}

export const SolidityTypes = strEnum([
    'address',
    'uint256',
    'uint8',
    'string',
    'bool',
]);

export type SolidityTypes = keyof typeof SolidityTypes;
