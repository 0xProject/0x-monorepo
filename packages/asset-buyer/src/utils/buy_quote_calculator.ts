import { marketUtils, rateUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import { AssetBuyerError, BuyQuote, BuyQuoteInfo, OrdersAndFillableAmounts } from '../types';

// Calculates a buy quote for orders that have WETH as the takerAsset
export const buyQuoteCalculator = {
    calculate(
        ordersAndFillableAmounts: OrdersAndFillableAmounts,
        feeOrdersAndFillableAmounts: OrdersAndFillableAmounts,
        assetBuyAmount: BigNumber,
        feePercentage: number,
        slippagePercentage: number,
    ): BuyQuote {
        const orders = ordersAndFillableAmounts.orders;
        const remainingFillableMakerAssetAmounts = ordersAndFillableAmounts.remainingFillableMakerAssetAmounts;
        const feeOrders = feeOrdersAndFillableAmounts.orders;
        const remainingFillableFeeAmounts = feeOrdersAndFillableAmounts.remainingFillableMakerAssetAmounts;
        const slippageBufferAmount = assetBuyAmount.mul(slippagePercentage).round();
        // find the orders that cover the desired assetBuyAmount (with slippage)
        const {
            resultOrders,
            remainingFillAmount,
            ordersRemainingFillableMakerAssetAmounts,
        } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(orders, assetBuyAmount, {
            remainingFillableMakerAssetAmounts,
            slippageBufferAmount,
        });
        // if we do not have enough orders to cover the desired assetBuyAmount, throw
        if (remainingFillAmount.gt(constants.ZERO_AMOUNT)) {
            throw new Error(AssetBuyerError.InsufficientAssetLiquidity);
        }
        // given the orders calculated above, find the fee-orders that cover the desired assetBuyAmount (with slippage)
        // TODO(bmillman): optimization
        // update this logic to find the minimum amount of feeOrders to cover the worst case as opposed to
        // finding order that cover all fees, this will help with estimating ETH and minimizing gas usage
        const {
            resultFeeOrders,
            remainingFeeAmount,
            feeOrdersRemainingFillableMakerAssetAmounts,
        } = marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(resultOrders, feeOrders, {
            remainingFillableMakerAssetAmounts: ordersRemainingFillableMakerAssetAmounts,
            remainingFillableFeeAmounts,
        });
        // if we do not have enough feeOrders to cover the fees, throw
        if (remainingFeeAmount.gt(constants.ZERO_AMOUNT)) {
            throw new Error(AssetBuyerError.InsufficientZrxLiquidity);
        }
        // assetData information for the result
        const assetData = orders[0].makerAssetData;
        // compile the resulting trimmed set of orders for makerAsset and feeOrders that are needed for assetBuyAmount
        const trimmedOrdersAndFillableAmounts: OrdersAndFillableAmounts = {
            orders: resultOrders,
            remainingFillableMakerAssetAmounts: ordersRemainingFillableMakerAssetAmounts,
        };
        const trimmedFeeOrdersAndFillableAmounts: OrdersAndFillableAmounts = {
            orders: resultFeeOrders,
            remainingFillableMakerAssetAmounts: feeOrdersRemainingFillableMakerAssetAmounts,
        };
        const bestCaseQuoteInfo = calculateQuoteInfo(
            trimmedOrdersAndFillableAmounts,
            trimmedFeeOrdersAndFillableAmounts,
            assetBuyAmount,
            feePercentage,
        );
        // in order to calculate the maxRate, reverse the ordersAndFillableAmounts such that they are sorted from worst rate to best rate
        const worstCaseQuoteInfo = calculateQuoteInfo(
            reverseOrdersAndFillableAmounts(trimmedOrdersAndFillableAmounts),
            reverseOrdersAndFillableAmounts(trimmedFeeOrdersAndFillableAmounts),
            assetBuyAmount,
            feePercentage,
        );
        return {
            assetData,
            orders: resultOrders,
            feeOrders: resultFeeOrders,
            bestCaseQuoteInfo,
            worstCaseQuoteInfo,
            assetBuyAmount,
            feePercentage,
        };
    },
};

function calculateQuoteInfo(
    ordersAndFillableAmounts: OrdersAndFillableAmounts,
    feeOrdersAndFillableAmounts: OrdersAndFillableAmounts,
    assetBuyAmount: BigNumber,
    feePercentage: number,
): BuyQuoteInfo {
    // find the total eth and zrx needed to buy assetAmount from the resultOrders from left to right
    const [ethAmountToBuyAsset, zrxAmountToBuyAsset] = findEthAndZrxAmountNeededToBuyAsset(
        ordersAndFillableAmounts,
        assetBuyAmount,
    );
    // find the total eth needed to buy fees
    const ethAmountToBuyFees = findEthAmountNeededToBuyFees(feeOrdersAndFillableAmounts, zrxAmountToBuyAsset);
    const affiliateFeeEthAmount = ethAmountToBuyAsset.mul(feePercentage);
    const totalEthAmountWithoutAffiliateFee = ethAmountToBuyAsset.plus(ethAmountToBuyFees);
    const totalEthAmount = totalEthAmountWithoutAffiliateFee.plus(affiliateFeeEthAmount);
    // divide into the assetBuyAmount in order to find rate of makerAsset / WETH
    const ethPerAssetPrice = totalEthAmountWithoutAffiliateFee.div(assetBuyAmount);
    return {
        totalEthAmount,
        feeEthAmount: affiliateFeeEthAmount,
        ethPerAssetPrice,
    };
}

// given an OrdersAndFillableAmounts, reverse the orders and remainingFillableMakerAssetAmounts properties
function reverseOrdersAndFillableAmounts(ordersAndFillableAmounts: OrdersAndFillableAmounts): OrdersAndFillableAmounts {
    const ordersCopy = _.clone(ordersAndFillableAmounts.orders);
    const remainingFillableMakerAssetAmountsCopy = _.clone(ordersAndFillableAmounts.remainingFillableMakerAssetAmounts);
    return {
        orders: ordersCopy.reverse(),
        remainingFillableMakerAssetAmounts: remainingFillableMakerAssetAmountsCopy.reverse(),
    };
}

function findEthAmountNeededToBuyFees(
    feeOrdersAndFillableAmounts: OrdersAndFillableAmounts,
    feeAmount: BigNumber,
): BigNumber {
    const { orders, remainingFillableMakerAssetAmounts } = feeOrdersAndFillableAmounts;
    const result = _.reduce(
        orders,
        (acc, order, index) => {
            const remainingFillableMakerAssetAmount = remainingFillableMakerAssetAmounts[index];
            const amountToFill = BigNumber.min(acc.remainingFeeAmount, remainingFillableMakerAssetAmount);
            const feeAdjustedRate = rateUtils.getFeeAdjustedRateOfFeeOrder(order);
            const ethAmountForThisOrder = feeAdjustedRate.mul(amountToFill);
            return {
                ethAmount: acc.ethAmount.plus(ethAmountForThisOrder),
                remainingFeeAmount: BigNumber.max(constants.ZERO_AMOUNT, acc.remainingFeeAmount.minus(amountToFill)),
            };
        },
        {
            ethAmount: constants.ZERO_AMOUNT,
            remainingFeeAmount: feeAmount,
        },
    );
    return result.ethAmount;
}

function findEthAndZrxAmountNeededToBuyAsset(
    ordersAndFillableAmounts: OrdersAndFillableAmounts,
    assetBuyAmount: BigNumber,
): [BigNumber, BigNumber] {
    const { orders, remainingFillableMakerAssetAmounts } = ordersAndFillableAmounts;
    const result = _.reduce(
        orders,
        (acc, order, index) => {
            const remainingFillableMakerAssetAmount = remainingFillableMakerAssetAmounts[index];
            const amountToFill = BigNumber.min(acc.remainingAssetBuyAmount, remainingFillableMakerAssetAmount);
            // find the amount of eth required to fill amountToFill (amountToFill / makerAssetAmount) * takerAssetAmount
            const ethAmountForThisOrder = amountToFill
                .mul(order.takerAssetAmount)
                .dividedToIntegerBy(order.makerAssetAmount);
            // find the amount of zrx required to fill fees for amountToFill (amountToFill / makerAssetAmount) * takerFee
            const zrxAmountForThisOrder = amountToFill.mul(order.takerFee).dividedToIntegerBy(order.makerAssetAmount);
            return {
                ethAmount: acc.ethAmount.plus(ethAmountForThisOrder),
                zrxAmount: acc.zrxAmount.plus(zrxAmountForThisOrder),
                remainingAssetBuyAmount: BigNumber.max(
                    constants.ZERO_AMOUNT,
                    acc.remainingAssetBuyAmount.minus(amountToFill),
                ),
            };
        },
        {
            ethAmount: constants.ZERO_AMOUNT,
            zrxAmount: constants.ZERO_AMOUNT,
            remainingAssetBuyAmount: assetBuyAmount,
        },
    );
    return [result.ethAmount, result.zrxAmount];
}
