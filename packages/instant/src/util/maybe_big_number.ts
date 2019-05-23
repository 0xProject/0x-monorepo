import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { Maybe } from '../types';

export const maybeBigNumberUtil = {
    // converts a string to a Maybe<BigNumber>
    // if string is a NaN, considered undefined
    stringToMaybeBigNumber: (stringValue: string): Maybe<BigNumber> => {
        let validBigNumber: BigNumber;
        try {
            validBigNumber = new BigNumber(stringValue);
        } catch {
            return undefined;
        }

        return validBigNumber.isNaN() ? undefined : validBigNumber;
    },
    areMaybeBigNumbersEqual: (val1: Maybe<BigNumber>, val2: Maybe<BigNumber>): boolean => {
        if (val1 !== undefined && val2 !== undefined) {
            return val1.isEqualTo(val2);
        }
        return val1 === undefined && val2 === undefined;
    },
    // converts a BigNumber or String to the BigNumber used by 0x libraries
    toMaybeBigNumber: (value: any): Maybe<BigNumber> => {
        if (_.isString(value)) {
            return maybeBigNumberUtil.stringToMaybeBigNumber(value);
        }
        // checks for pre v8 bignumber with member variable
        if (BigNumber.isBigNumber(value) || value.isBigNumber) {
            return new BigNumber(value.toString());
        }
        return undefined;
    },
};
