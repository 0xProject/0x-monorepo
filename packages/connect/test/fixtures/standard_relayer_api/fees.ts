import { BigNumber } from '@0xproject/utils';

import { FeesResponse } from '../../../src/types';

export const feesResponse: FeesResponse = {
    feeRecipient: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
    makerFee: new BigNumber('10000000000000000'),
    takerFee: new BigNumber('30000000000000000'),
};
