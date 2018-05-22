import { BigNumber } from '@0xproject/utils';

export const utils = {
    spawnSwitchErr(name: string, value: any): Error {
        return new Error(`Unexpected switch value: ${value} encountered for ${name}`);
    },
    getCurrentUnixTimestampSec(): BigNumber {
        const milisecondsInASecond = 1000;
        return new BigNumber(Date.now() / milisecondsInASecond).round();
    },
    getCurrentUnixTimestampMs(): BigNumber {
        return new BigNumber(Date.now());
    },
};
