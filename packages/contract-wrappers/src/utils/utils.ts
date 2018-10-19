import { EthRPCClient } from '@0x/eth-rpc-client';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from './constants';

export const utils = {
    getCurrentUnixTimestampSec(): BigNumber {
        const milisecondsInSecond = 1000;
        return new BigNumber(Date.now() / milisecondsInSecond).round();
    },
    getCurrentUnixTimestampMs(): BigNumber {
        return new BigNumber(Date.now());
    },
    numberPercentageToEtherTokenAmountPercentage(percentage: number): BigNumber {
        return EthRPCClient.toBaseUnitAmount(constants.ONE_AMOUNT, constants.ETHER_TOKEN_DECIMALS).mul(percentage);
    },
    removeUndefinedProperties<T extends object>(obj: T): Partial<T> {
        return _.pickBy(obj);
    },
};
