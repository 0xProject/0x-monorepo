import { BigNumber } from '@0xproject/utils';

export const constants = {
    NULL_ADDRESS: '0x0000000000000000000000000000000000000000',
    // tslint:disable-next-line:custom-no-magic-numbers
    UNLIMITED_ALLOWANCE_IN_BASE_UNITS: new BigNumber(2).pow(256).minus(1),
    TESTRPC_NETWORK_ID: 50,
};
