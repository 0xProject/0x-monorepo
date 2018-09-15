import { OrderAndTraderInfo, OrderStatus, OrderValidatorWrapper } from '@0xproject/contract-wrappers';
import { sortingUtils } from '@0xproject/order-utils';
import { RemainingFillableCalculator } from '@0xproject/order-utils/lib/src/remaining_fillable_calculator';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    AssetBuyerOrdersAndFillableAmounts,
    OrderFetcherResponse,
    SignedOrderWithRemainingFillableMakerAssetAmount,
} from '../types';

import { orderUtils } from './order_utils';

interface OrdersAndRemainingFillableMakerAssetAmounts {
    orders: SignedOrder[];
    remainingFillableMakerAssetAmounts: BigNumber[];
}

export const orderFetcherResponseProcessor = {
    /**
     * Take the responses for the target orders to buy and fee orders and process them.
     * Processing includes:
     * - Drop orders that are expired or not open orders (null taker address)
     * - If shouldValidateOnChain, attempt to grab fillable amounts from on-chain otherwise assume completely fillable
     * - Sort by rate
     */
    async processAsync(
        targetOrderFetcherResponse: OrderFetcherResponse,
        feeOrderFetcherResponse: OrderFetcherResponse,
        zrxTokenAssetData: string,
        orderValidator?: OrderValidatorWrapper,
    ): Promise<AssetBuyerOrdersAndFillableAmounts> {
        // drop orders that are expired or not open
        const filteredTargetOrders = filterOutExpiredAndNonOpenOrders(targetOrderFetcherResponse.orders);
        const filteredFeeOrders = filterOutExpiredAndNonOpenOrders(feeOrderFetcherResponse.orders);
        // set the orders to be sorted equal to the filtered orders
        let unsortedTargetOrders = filteredTargetOrders;
        let unsortedFeeOrders = filteredFeeOrders;
        // if an orderValidator is provided, use on chain information to calculate remaining fillable makerAsset amounts
        if (!_.isUndefined(orderValidator)) {
            // TODO: critical
            // try catch these requests and throw a more domain specific error
            // TODO: optimization
            // reduce this to once RPC call buy combining orders into one array and then splitting up the response
            const [targetOrdersAndTradersInfo, feeOrdersAndTradersInfo] = await Promise.all(
                _.map([filteredTargetOrders, filteredFeeOrders], ordersToBeValidated => {
                    const takerAddresses = _.map(ordersToBeValidated, () => constants.NULL_ADDRESS);
                    return orderValidator.getOrdersAndTradersInfoAsync(ordersToBeValidated, takerAddresses);
                }),
            );
            // take orders + on chain information and find the valid orders and remaining fillable maker asset amounts
            unsortedTargetOrders = getValidOrdersWithRemainingFillableMakerAssetAmountsFromOnChain(
                filteredTargetOrders,
                targetOrdersAndTradersInfo,
                zrxTokenAssetData,
            );
            // take orders + on chain information and find the valid orders and remaining fillable maker asset amounts
            unsortedFeeOrders = getValidOrdersWithRemainingFillableMakerAssetAmountsFromOnChain(
                filteredFeeOrders,
                feeOrdersAndTradersInfo,
                zrxTokenAssetData,
            );
        }
        // sort orders by rate
        // TODO: optimization
        // provide a feeRate to the sorting function to more accurately sort based on the current market for ZRX tokens
        const sortedTargetOrders = sortingUtils.sortOrdersByFeeAdjustedRate(unsortedTargetOrders);
        const sortedFeeOrders = sortingUtils.sortFeeOrdersByFeeAdjustedRate(unsortedFeeOrders);
        // unbundle orders and fillable amounts and compile final result
        const targetOrdersAndRemainingFillableMakerAssetAmounts = unbundleOrdersWithAmounts(sortedTargetOrders);
        const feeOrdersAndRemainingFillableMakerAssetAmounts = unbundleOrdersWithAmounts(sortedFeeOrders);
        return {
            orders: targetOrdersAndRemainingFillableMakerAssetAmounts.orders,
            feeOrders: feeOrdersAndRemainingFillableMakerAssetAmounts.orders,
            remainingFillableMakerAssetAmounts:
                targetOrdersAndRemainingFillableMakerAssetAmounts.remainingFillableMakerAssetAmounts,
            remainingFillableFeeAmounts:
                feeOrdersAndRemainingFillableMakerAssetAmounts.remainingFillableMakerAssetAmounts,
        };
    },
};

/**
 * Given an array of orders, return a new array with expired and non open orders filtered out.
 */
function filterOutExpiredAndNonOpenOrders(
    orders: SignedOrderWithRemainingFillableMakerAssetAmount[],
): SignedOrderWithRemainingFillableMakerAssetAmount[] {
    const result = _.filter(orders, order => {
        return orderUtils.isOpenOrder(order) && orderUtils.isOrderExpired(order);
    });
    return result;
}

/**
 * Given an array of orders and corresponding on-chain infos, return a subset of the orders
 * that are still fillable orders with their corresponding remainingFillableMakerAssetAmounts.
 */
function getValidOrdersWithRemainingFillableMakerAssetAmountsFromOnChain(
    inputOrders: SignedOrder[],
    ordersAndTradersInfo: OrderAndTraderInfo[],
    zrxAssetData: string,
): SignedOrderWithRemainingFillableMakerAssetAmount[] {
    // iterate through the input orders and find the ones that are still fillable
    // for the orders that are still fillable, calculate the remaining fillable maker asset amount
    const result = _.reduce(
        inputOrders,
        (accOrders, order, index) => {
            // get corresponding on-chain state for the order
            const { orderInfo, traderInfo } = ordersAndTradersInfo[index];
            // if the order IS NOT fillable, do not add anything to the accumulations and continue iterating
            if (orderInfo.orderStatus !== OrderStatus.FILLABLE) {
                return accOrders;
            }
            // if the order IS fillable, add the order and calculate the remaining fillable amount
            const transferrableAssetAmount = BigNumber.min([traderInfo.makerAllowance, traderInfo.makerBalance]);
            const transferrableFeeAssetAmount = BigNumber.min([
                traderInfo.makerZrxAllowance,
                traderInfo.makerZrxBalance,
            ]);
            const remainingTakerAssetAmount = order.takerAssetAmount.minus(orderInfo.orderTakerAssetFilledAmount);
            const remainingMakerAssetAmount = orderUtils.calculateRemainingMakerAssetAmount(
                order,
                remainingTakerAssetAmount,
            );
            const remainingFillableCalculator = new RemainingFillableCalculator(
                order.makerFee,
                order.makerAssetAmount,
                order.makerAssetData === zrxAssetData,
                transferrableAssetAmount,
                transferrableFeeAssetAmount,
                remainingMakerAssetAmount,
            );
            const remainingFillableAmount = remainingFillableCalculator.computeRemainingFillable();
            // if the order does not have any remaining fillable makerAsset, do not add anything to the accumulations and continue iterating
            if (remainingFillableAmount.lte(constants.ZERO_AMOUNT)) {
                return accOrders;
            }
            const orderWithRemainingFillableMakerAssetAmount = {
                ...order,
                remainingFillableMakerAssetAmount: remainingFillableAmount,
            };
            const newAccOrders = _.concat(accOrders, orderWithRemainingFillableMakerAssetAmount);
            return newAccOrders;
        },
        [] as SignedOrderWithRemainingFillableMakerAssetAmount[],
    );
    return result;
}

/**
 * Given an array of orders with remaining fillable maker asset amounts. Unbundle into an instance of OrdersAndRemainingFillableMakerAssetAmounts.
 * If an order is missing a corresponding remainingFillableMakerAssetAmount, assume it is completely fillable.
 */
function unbundleOrdersWithAmounts(
    ordersWithAmounts: SignedOrderWithRemainingFillableMakerAssetAmount[],
): OrdersAndRemainingFillableMakerAssetAmounts {
    const result = _.reduce(
        ordersWithAmounts,
        (acc, orderWithAmount) => {
            const { orders, remainingFillableMakerAssetAmounts } = acc;
            const { remainingFillableMakerAssetAmount, ...order } = orderWithAmount;
            // if we are still missing a remainingFillableMakerAssetAmount, assume the order is completely fillable
            const newRemainingAmount = remainingFillableMakerAssetAmount || order.makerAssetAmount;
            const newAcc = {
                orders: _.concat(orders, order),
                remainingFillableMakerAssetAmounts: _.concat(remainingFillableMakerAssetAmounts, newRemainingAmount),
            };
            return newAcc;
        },
        {
            orders: [] as SignedOrder[],
            remainingFillableMakerAssetAmounts: [] as BigNumber[],
        },
    );
    return result;
}
