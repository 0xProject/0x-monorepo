import { BigNumber } from '@0x/utils';

// tslint:disable custom-no-magic-numbers
export const constants = {
    NULL_ADDRESS: '0x0000000000000000000000000000000000000000',
    MAINNET_CHAIN_ID: 1,
    ZERO_AMOUNT: new BigNumber(0),
    TWO_WEEKS_IN_SEC: new BigNumber(14)
        .times(24)
        .times(60)
        .times(60),
    TEN_DAYS_IN_SEC: new BigNumber(10)
        .times(24)
        .times(60)
        .times(60),
    TWENTY_DAYS_IN_SEC: new BigNumber(20)
        .times(24)
        .times(60)
        .times(60),
};
