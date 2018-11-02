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
        if (!_.isUndefined(val1) && !_.isUndefined(val2)) {
            return val1.equals(val2);
        }
        return _.isUndefined(val1) && _.isUndefined(val2);
    },
};
