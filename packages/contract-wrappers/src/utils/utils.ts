import { BigNumber } from '@0xproject/utils';

export const utils = {
    getCurrentUnixTimestampSec(): BigNumber {
        const milisecondsInSecond = 1000;
        return new BigNumber(Date.now() / milisecondsInSecond).round();
    },
    getCurrentUnixTimestampMs(): BigNumber {
        return new BigNumber(Date.now());
    },
};
