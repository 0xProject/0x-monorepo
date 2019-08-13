import { SignedOrder } from '@0x/types';
import * as _ from 'lodash';

const NULL_BYTES = '0x';

export const calldataOptimizationUtils = {
    /**
     * Takes an array of orders and outputs an array of equivalent orders where all takerAssetData are '0x' and
     * all makerAssetData are '0x' except for that of the first order, which retains its original value
     * @param   orders         An array of SignedOrder objects
     * @returns optimized orders
     */
    optimizeForwarderOrders(orders: SignedOrder[]): SignedOrder[] {
        const optimizedOrders = _.map(orders, (order, index) =>
            transformOrder(order, {
                makerAssetData: index === 0 ? order.makerAssetData : NULL_BYTES,
                takerAssetData: NULL_BYTES,
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
    optimizeForwarderFeeOrders(orders: SignedOrder[]): SignedOrder[] {
        const optimizedOrders = _.map(orders, (order, index) =>
            transformOrder(order, {
                makerAssetData: NULL_BYTES,
                takerAssetData: NULL_BYTES,
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
