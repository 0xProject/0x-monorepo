import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { MarketOperation, SignedOrderWithFillableAmounts } from '../types';

import { utils } from './utils';

export const fillableAmountsUtils = {
    getAssetAmountAvailable(order: SignedOrderWithFillableAmounts, operation: MarketOperation): BigNumber {
        if (operation === MarketOperation.Buy) {
            if (utils.isOrderTakerFeePayableWithMakerAsset(order)) {
                return order.fillableMakerAssetAmount.minus(order.fillableTakerFeeAmount);
            } else {
                return order.fillableMakerAssetAmount;
            }
        } else {
            if (utils.isOrderTakerFeePayableWithTakerAsset(order)) {
                return order.fillableTakerAssetAmount.plus(order.fillableTakerFeeAmount);
            } else {
                return order.fillableTakerAssetAmount;
            }
        }
    },
};
