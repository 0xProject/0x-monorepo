import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { MaybeBigNumber } from '../types';

export const maybeBigNumberUtil = {
    // converts a string to a MaybeBigNumber
    // if string is a NaN, considered undefined
    stringToMaybeBigNumber: (stringValue: string): MaybeBigNumber => {
        let validBigNumber: BigNumber;
        try {
            validBigNumber = new BigNumber(stringValue);
        } catch {
            return undefined;
        }

        return validBigNumber.isNaN() ? undefined : validBigNumber;
    },
    areMaybeBigNumbersEqual: (val1: MaybeBigNumber, val2: MaybeBigNumber): boolean => {
        if (!_.isUndefined(val1) && !_.isUndefined(val2)) {
            return val1.equals(val2);
        }
        return _.isUndefined(val1) && _.isUndefined(val2);
    },
};
