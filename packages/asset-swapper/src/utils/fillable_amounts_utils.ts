import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { SignedOrderWithFillableAmounts } from '../types';

import { isOrderTakerFeePayableWithMakerAsset, isOrderTakerFeePayableWithTakerAsset } from './utils';

export const fillableAmountsUtils = {
    getTakerAssetAmountSwappedAfterOrderFees(order: SignedOrderWithFillableAmounts): BigNumber {
        if (isOrderTakerFeePayableWithTakerAsset(order)) {
            return order.fillableTakerAssetAmount.plus(order.fillableTakerFeeAmount);
        } else {
            return order.fillableTakerAssetAmount;
        }
    },
    getMakerAssetAmountSwappedAfterOrderFees(order: SignedOrderWithFillableAmounts): BigNumber {
        if (isOrderTakerFeePayableWithMakerAsset(order)) {
            return order.fillableMakerAssetAmount.minus(order.fillableTakerFeeAmount);
        } else {
            return order.fillableMakerAssetAmount;
        }
    },
};
