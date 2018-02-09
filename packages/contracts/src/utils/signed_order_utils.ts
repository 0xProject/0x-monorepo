import { SignedOrder } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { crypto } from './crypto';

export const signedOrderUtils = {
    createFill: (signedOrder: SignedOrder, takerTokenFillAmount?: BigNumber) => {
        const fill = {
            ...signedOrderUtils.getOrderAddressesAndValues(signedOrder),
            takerTokenFillAmount: takerTokenFillAmount || signedOrder.takerTokenAmount,
            ...signedOrder.ecSignature,
        };
        return fill;
    },
    createCancel(signedOrder: SignedOrder, takerTokenCancelAmount?: BigNumber) {
        const cancel = {
            ...signedOrderUtils.getOrderAddressesAndValues(signedOrder),
            takerTokenCancelAmount: takerTokenCancelAmount || signedOrder.takerTokenAmount,
        };
        return cancel;
    },
    getOrderAddressesAndValues(signedOrder: SignedOrder) {
        return {
            orderAddresses: [
                signedOrder.maker,
                signedOrder.taker,
                signedOrder.makerTokenAddress,
                signedOrder.takerTokenAddress,
                signedOrder.feeRecipient,
            ],
            orderValues: [
                signedOrder.makerTokenAmount,
                signedOrder.takerTokenAmount,
                signedOrder.makerFee,
                signedOrder.takerFee,
                signedOrder.expirationUnixTimestampSec,
                signedOrder.salt,
            ],
        };
    },
};
