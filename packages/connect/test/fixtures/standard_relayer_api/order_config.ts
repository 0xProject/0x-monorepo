import { BigNumber } from '@0x/utils';

import { OrderConfigResponse } from '@0x/types';

export const orderConfigResponse: OrderConfigResponse = {
    senderAddress: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
    feeRecipientAddress: '0xb046140686d052fff581f63f8136cce132e857da',
    makerFee: new BigNumber('100000000000000'),
    takerFee: new BigNumber('200000000000000'),
    makerFeeAssetData: '0xf47261b04c32345ced77393b3530b1eed0f346429d',
    takerFeeAssetData: '0xf47261b04c32345ced77393b3530b1eed0f346429d',
};
