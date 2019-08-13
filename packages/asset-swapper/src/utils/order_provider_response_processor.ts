import { OrderAndTraderInfo, OrderStatus, OrderValidatorContract } from '@0x/contract-wrappers';
import { orderCalculationUtils, sortingUtils } from '@0x/order-utils';
import { RemainingFillableCalculator } from '@0x/order-utils/lib/src/remaining_fillable_calculator';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    OrderProviderResponse,
    OrdersAndFillableAmounts,
    SignedOrderWithRemainingFillableMakerAssetAmount,
    SwapQuoterError,
} from '../types';

export const orderProviderResponseProcessor = {
    throwIfInvalidResponse(response: OrderProviderResponse, makerAssetData: string, takerAssetData: string): void {
        _.forEach(response.orders, order => {
            if (order.makerAssetData !== makerAssetData || order.takerAssetData !== takerAssetData) {
                throw new Error(SwapQuoterError.InvalidOrderProviderResponse);
            }
        });
    },
    /**
     * Take the responses for the target orders to buy and fee orders and process them.
     * Processing includes:
     * - Drop orders that are expired or not open orders (null taker address)
     * - If an orderValidator, attempt to grab fillable amounts from on-chain otherwise assume completely fillable
     * - Sort by rate
     */
    async processAsync(
        orderProviderResponse: OrderProviderResponse,
        isMakerAssetZrxToken: boolean,
        expiryBufferMs: number,
        orderValidator?: OrderValidatorContract,
    ): Promise<OrdersAndFillableAmounts> {
        // drop orders that are expired or not open
        const filteredOrders = filterOutExpiredAndNonOpenOrders(
            orderProviderResponse.orders,
            expiryBufferMs / constants.ONE_SECOND_MS,
        );
        // set the orders to be sorted equal to the filtered orders
        let unsortedOrders = filteredOrders;
        // if an orderValidator is provided, use on chain information to calculate remaining fillable makerAsset amounts
        if (orderValidator !== undefined) {
            const takerAddresses = _.map(filteredOrders, () => constants.NULL_ADDRESS);
            try {
                const [ordersInfo, tradersInfo] = await orderValidator.getOrdersAndTradersInfo.callAsync(
                    filteredOrders,
                    takerAddresses,
                );
                const ordersAndTradersInfo: OrderAndTraderInfo[] = ordersInfo.map((orderInfo, index) => {
                    const singleOrderAndTraderInfo: OrderAndTraderInfo = {
                        orderInfo,
                        traderInfo: tradersInfo[index],
                    };
                    return singleOrderAndTraderInfo;
                });
                // take orders + on chain information and find the valid orders and remaining fillable maker asset amounts
                unsortedOrders = getValidOrdersWithRemainingFillableMakerAssetAmountsFromOnChain(
                    filteredOrders,
                    ordersAndTradersInfo,
                    isMakerAssetZrxToken,
                );
            } catch (err) {
                // Sometimes we observe this call to orderValidator fail with response `0x`
                // Because of differences in Parity / Geth implementations, its very hard to tell if this response is a "system error"
                // or a revert. In this case we just swallow these errors and fallback to partial fill information from the SRA.
                // TODO(bmillman): report these errors so we have an idea of how often we're getting these failures.
            }
        }
        // sort orders by rate
        // TODO(bmillman): optimization
        // provide a feeRate to the sorting function to more accurately sort based on the current market for ZRX tokens
        const sortedOrders = isMakerAssetZrxToken
            ? sortingUtils.sortFeeOrdersByFeeAdjustedRate(unsortedOrders)
            : sortingUtils.sortOrdersByFeeAdjustedRate(unsortedOrders);
        // unbundle orders and fillable amounts and compile final result
        const result = unbundleOrdersWithAmounts(sortedOrders);
        return result;
    },
};

/**
 * Given an array of orders, return a new array with expired and non open orders filtered out.
 */
function filterOutExpiredAndNonOpenOrders(
    orders: SignedOrderWithRemainingFillableMakerAssetAmount[],
    expiryBufferMs: number,
): SignedOrderWithRemainingFillableMakerAssetAmount[] {
    const result = _.filter(orders, order => {
        return (
            orderCalculationUtils.isOpenOrder(order) &&
            !orderCalculationUtils.willOrderExpire(order, expiryBufferMs / constants.ONE_SECOND_MS)
        );
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
    isMakerAssetZrxToken: boolean,
): SignedOrderWithRemainingFillableMakerAssetAmount[] {
    // iterate through the input orders and find the ones that are still fillable
    // for the orders that are still fillable, calculate the remaining fillable maker asset amount
    const result = _.reduce(
        inputOrders,
        (accOrders, order, index) => {
            // get corresponding on-chain state for the order
            const { orderInfo, traderInfo } = ordersAndTradersInfo[index];
            // if the order IS NOT fillable, do not add anything to the accumulations and continue iterating
            if (orderInfo.orderStatus !== OrderStatus.Fillable) {
                return accOrders;
            }
            // if the order IS fillable, add the order and calculate the remaining fillable amount
            const transferrableAssetAmount = BigNumber.min(traderInfo.makerAllowance, traderInfo.makerBalance);
            const transferrableFeeAssetAmount = BigNumber.min(traderInfo.makerZrxAllowance, traderInfo.makerZrxBalance);
            const remainingTakerAssetAmount = order.takerAssetAmount.minus(orderInfo.orderTakerAssetFilledAmount);
            const remainingMakerAssetAmount = orderCalculationUtils.getMakerFillAmount(
                order,
                remainingTakerAssetAmount,
            );
            const remainingFillableCalculator = new RemainingFillableCalculator(
                order.makerFee,
                order.makerAssetAmount,
                isMakerAssetZrxToken,
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
): OrdersAndFillableAmounts {
    const result = _.reduce(
        ordersWithAmounts,
        (acc, orderWithAmount) => {
            const { orders, remainingFillableMakerAssetAmounts } = acc;
            const { remainingFillableMakerAssetAmount, ...order } = orderWithAmount;
            // if we are still missing a remainingFillableMakerAssetAmount, assume the order is completely fillable
            const newRemainingAmount = remainingFillableMakerAssetAmount || order.makerAssetAmount;
            // if remaining amount is less than or equal to zero, do not add it
            if (newRemainingAmount.lte(constants.ZERO_AMOUNT)) {
                return acc;
            }
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
