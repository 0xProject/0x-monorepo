import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { constants } from './constants';

export const utils = {
    getCurrentUnixTimestampSec(): BigNumber {
        const milisecondsInSecond = 1000;
        return new BigNumber(Date.now() / milisecondsInSecond).integerValue();
    },
    getCurrentUnixTimestampMs(): BigNumber {
        return new BigNumber(Date.now());
    },
    numberPercentageToEtherTokenAmountPercentage(percentage: number): BigNumber {
        return Web3Wrapper.toBaseUnitAmount(constants.ONE_AMOUNT, constants.ETHER_TOKEN_DECIMALS).multipliedBy(
            percentage,
        );
    },
    removeUndefinedProperties<T extends object>(obj: T): Partial<T> {
        return _.pickBy(obj);
    },
};
