import { schemas } from '@0x/json-schemas';
import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { assert } from './assert';
import { utils } from './utils';

export const sortingUtils = {
    sortOrders<T extends Order>(orders: T[]): T[] {
        assert.doesConformToSchema('orders', orders, schemas.ordersSchema);
        assert.isValidOrdersForSwapQuoter('orders', orders);
        const copiedOrders = _.cloneDeep(orders);
        copiedOrders.sort((firstOrder, secondOrder) => {
            const firstOrderRate = getTakerFeeAdjustedRateOfOrder(firstOrder);
            const secondOrderRate = getTakerFeeAdjustedRateOfOrder(secondOrder);
            return firstOrderRate.comparedTo(secondOrderRate);
        });
        return copiedOrders;
    },
};

function getTakerFeeAdjustedRateOfOrder(order: Order): BigNumber {
    const [adjustedMakerAssetAmount, adjustedTakerAssetAmount] = utils.getAdjustedMakerAndTakerAmountsFromTakerFees(
        order,
    );
    const rate = adjustedTakerAssetAmount.div(adjustedMakerAssetAmount);
    return rate;
}
