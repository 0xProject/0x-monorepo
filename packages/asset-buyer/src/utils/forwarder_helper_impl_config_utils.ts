import { sortingUtils } from '@0xproject/order-utils';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { ForwarderHelperImplConfig } from '../forwarder_helper_impl';

interface SignedOrderWithAmount extends SignedOrder {
    remainingFillAmount: BigNumber;
}

export const forwarderHelperImplConfigUtils = {
    sortedConfig(config: ForwarderHelperImplConfig): ForwarderHelperImplConfig {
        const { orders, feeOrders, remainingFillableMakerAssetAmounts, remainingFillableFeeAmounts } = config;
        // TODO: provide a feeRate to the sorting function to more accurately sort based on the current market for ZRX tokens
        const orderSorter = (ordersToSort: SignedOrder[]) => {
            return sortingUtils.sortOrdersByFeeAdjustedRate(ordersToSort);
        };
        const sortOrdersResult = sortOrdersAndRemainingFillAmounts(
            orderSorter,
            orders,
            remainingFillableMakerAssetAmounts,
        );
        const feeOrderSorter = (ordersToSort: SignedOrder[]) => {
            return sortingUtils.sortFeeOrdersByFeeAdjustedRate(ordersToSort);
        };
        const sortFeeOrdersResult = sortOrdersAndRemainingFillAmounts(
            feeOrderSorter,
            feeOrders,
            remainingFillableFeeAmounts,
        );
        return {
            orders: sortOrdersResult.orders,
            feeOrders: sortFeeOrdersResult.orders,
            remainingFillableMakerAssetAmounts: sortOrdersResult.remainingFillAmounts,
            remainingFillableFeeAmounts: sortFeeOrdersResult.remainingFillAmounts,
        };
    },
};

type OrderSorter = (orders: SignedOrder[]) => SignedOrder[];

function sortOrdersAndRemainingFillAmounts(
    orderSorter: OrderSorter,
    orders: SignedOrder[],
    remainingFillAmounts?: BigNumber[],
): { orders: SignedOrder[]; remainingFillAmounts?: BigNumber[] } {
    if (!_.isUndefined(remainingFillAmounts)) {
        // Bundle orders together with their remainingFillAmounts so that we can sort them together
        const orderWithAmounts = bundleSignedOrderWithAmounts(orders, remainingFillAmounts);
        // Sort
        const sortedOrderWithAmounts = orderSorter(orderWithAmounts) as SignedOrderWithAmount[];
        // Unbundle after sorting
        const unbundledSortedOrderWithAmounts = unbundleSignedOrderWithAmounts(sortedOrderWithAmounts);
        return {
            orders: unbundledSortedOrderWithAmounts.orders,
            remainingFillAmounts: unbundledSortedOrderWithAmounts.amounts,
        };
    } else {
        const sortedOrders = orderSorter(orders);
        return {
            orders: sortedOrders,
        };
    }
}

function bundleSignedOrderWithAmounts(orders: SignedOrder[], amounts: BigNumber[]): SignedOrderWithAmount[] {
    const ordersAndAmounts = _.map(orders, (order, index) => {
        return {
            ...order,
            remainingFillAmount: amounts[index],
        };
    });
    return ordersAndAmounts;
}

function unbundleSignedOrderWithAmounts(
    signedOrderWithAmounts: SignedOrderWithAmount[],
): { orders: SignedOrder[]; amounts: BigNumber[] } {
    const orders = _.map(signedOrderWithAmounts, order => {
        const { remainingFillAmount, ...rest } = order;
        return rest;
    });
    const amounts = _.map(signedOrderWithAmounts, order => {
        const { remainingFillAmount } = order;
        return remainingFillAmount;
    });
    return {
        orders,
        amounts,
    };
}
