import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { SignedOrderWithFillableAmounts } from '../types';

import { utils } from './utils';

export const fillableAmountsUtils = {
    getTakerAssetAmountSwappedAfterFees(order: SignedOrderWithFillableAmounts): BigNumber {
        if (utils.isOrderTakerFeePayableWithTakerAsset(order)) {
            return order.fillableTakerAssetAmount.plus(order.fillableTakerFeeAmount);
        } else {
            return order.fillableTakerAssetAmount;
        }
    },
    getMakerAssetAmountSwappedAfterFees(order: SignedOrderWithFillableAmounts): BigNumber {
        if (utils.isOrderTakerFeePayableWithMakerAsset(order)) {
            return order.fillableMakerAssetAmount.minus(order.fillableTakerFeeAmount);
        } else {
            return order.fillableMakerAssetAmount;
        }
    },
};
