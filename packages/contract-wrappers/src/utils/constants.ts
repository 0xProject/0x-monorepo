import { BigNumber } from '@0x/utils';

export const constants = {
    UNLIMITED_ALLOWANCE_IN_BASE_UNITS: new BigNumber(2).pow(256).minus(1), // tslint:disable-line:custom-no-magic-numbers
};
