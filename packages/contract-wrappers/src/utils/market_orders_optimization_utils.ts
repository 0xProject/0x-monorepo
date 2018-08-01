import { SignedOrder } from '@0xproject/types';
import * as _ from 'lodash';

import { constants } from './constants';

export const marketOrdersOptimizationUtils = {
    /**
     * Takes an array of orders and outputs an array of equivalent orders where all takerAssetData are '0x' and
     * all makerAssetData are '0x' except for that of the first order, which retains its original value
     * @param   orders         An array of SignedOrder objects
     * @returns optimized orders
     */
    optimizeMarketOrders(orders: SignedOrder[]): SignedOrder[] {
        const optimizedOrders = _.map(orders, (order, index) =>
            transformOrder(order, {
                makerAssetData: index === 0 ? order.makerAssetData : constants.NULL_BYTES,
                takerAssetData: constants.NULL_BYTES,
            }),
        );
        return optimizedOrders;
    },
    /**
     * Takes an array of orders and outputs an array of equivalent orders where all takerAssetData are '0x' and
     * all makerAssetData are '0x'
     * @param   orders         An array of SignedOrder objects
     * @returns optimized orders
     */
    optimizeFeeOrders(orders: SignedOrder[]): SignedOrder[] {
        const optimizedOrders = _.map(orders, (order, index) =>
            transformOrder(order, {
                makerAssetData: constants.NULL_BYTES,
                takerAssetData: constants.NULL_BYTES,
            }),
        );
        return optimizedOrders;
    },
};

const transformOrder = (order: SignedOrder, partialOrder: Partial<SignedOrder>) => {
    return {
        ...order,
        ...partialOrder,
    };
};
