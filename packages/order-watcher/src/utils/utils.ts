import { BigNumber } from '@0x/utils';

export const utils = {
    getCurrentUnixTimestampSec(): BigNumber {
        const milisecondsInASecond = 1000;
        return new BigNumber(Date.now() / milisecondsInASecond).round();
    },
    getCurrentUnixTimestampMs(): BigNumber {
        return new BigNumber(Date.now());
    },
};
