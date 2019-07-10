import { marketUtils, orderCalculationUtils, SignedOrder } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import { InsufficientAssetLiquidityError } from '../errors';
import { AssetBuyerError, BuyQuote, BuyQuoteInfo, OrdersAndFillableAmounts } from '../types';

// Calculates a buy quote for orders that have WETH as the takerAsset
export const buyQuoteCalculator = {
    calculate(
        ordersAndFillableAmounts: OrdersAndFillableAmounts,
        feeOrdersAndFillableAmounts: OrdersAndFillableAmounts,
        assetBuyAmount: BigNumber,
        feePercentage: number,
        slippagePercentage: number,
        isMakerAssetZrxToken: boolean,
    ): BuyQuote {
        const orders = ordersAndFillableAmounts.orders;
        const remainingFillableMakerAssetAmounts = ordersAndFillableAmounts.remainingFillableMakerAssetAmounts;
        const feeOrders = feeOrdersAndFillableAmounts.orders;
        const remainingFillableFeeAmounts = feeOrdersAndFillableAmounts.remainingFillableMakerAssetAmounts;
        const slippageBufferAmount = assetBuyAmount.multipliedBy(slippagePercentage).integerValue();
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
            // We needed the amount they requested to buy, plus the amount for slippage
            const totalAmountRequested = assetBuyAmount.plus(slippageBufferAmount);
            const amountAbleToFill = totalAmountRequested.minus(remainingFillAmount);
            // multiplierNeededWithSlippage represents what we need to multiply the assetBuyAmount by
            // in order to get the total amount needed considering slippage
            // i.e. if slippagePercent was 0.2 (20%), multiplierNeededWithSlippage would be 1.2
            const multiplierNeededWithSlippage = new BigNumber(1).plus(slippagePercentage);
            // Given amountAvailableToFillConsideringSlippage * multiplierNeededWithSlippage = amountAbleToFill
            // We divide amountUnableToFill by multiplierNeededWithSlippage to determine amountAvailableToFillConsideringSlippage
            const amountAvailableToFillConsideringSlippage = amountAbleToFill
                .div(multiplierNeededWithSlippage)
                .integerValue(BigNumber.ROUND_FLOOR);

            throw new InsufficientAssetLiquidityError(amountAvailableToFillConsideringSlippage);
        }
        // if we are not buying ZRX:
        // given the orders calculated above, find the fee-orders that cover the desired assetBuyAmount (with slippage)
        // TODO(bmillman): optimization
        // update this logic to find the minimum amount of feeOrders to cover the worst case as opposed to
        // finding order that cover all fees, this will help with estimating ETH and minimizing gas usage
        let resultFeeOrders = [] as SignedOrder[];
        let feeOrdersRemainingFillableMakerAssetAmounts = [] as BigNumber[];
        if (!isMakerAssetZrxToken) {
            const feeOrdersAndRemainingFeeAmount = marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(
                resultOrders,
                feeOrders,
                {
                    remainingFillableMakerAssetAmounts: ordersRemainingFillableMakerAssetAmounts,
                    remainingFillableFeeAmounts,
                },
            );
            // if we do not have enough feeOrders to cover the fees, throw
            if (feeOrdersAndRemainingFeeAmount.remainingFeeAmount.gt(constants.ZERO_AMOUNT)) {
                throw new Error(AssetBuyerError.InsufficientZrxLiquidity);
            }
            resultFeeOrders = feeOrdersAndRemainingFeeAmount.resultFeeOrders;
            feeOrdersRemainingFillableMakerAssetAmounts =
                feeOrdersAndRemainingFeeAmount.feeOrdersRemainingFillableMakerAssetAmounts;
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
            isMakerAssetZrxToken,
        );
        // in order to calculate the maxRate, reverse the ordersAndFillableAmounts such that they are sorted from worst rate to best rate
        const worstCaseQuoteInfo = calculateQuoteInfo(
            reverseOrdersAndFillableAmounts(trimmedOrdersAndFillableAmounts),
            reverseOrdersAndFillableAmounts(trimmedFeeOrdersAndFillableAmounts),
            assetBuyAmount,
            feePercentage,
            isMakerAssetZrxToken,
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
    isMakerAssetZrxToken: boolean,
): BuyQuoteInfo {
    // find the total eth and zrx needed to buy assetAmount from the resultOrders from left to right
    let assetEthAmount = constants.ZERO_AMOUNT;
    let zrxEthAmount = constants.ZERO_AMOUNT;
    if (isMakerAssetZrxToken) {
        assetEthAmount = findEthAmountNeededToBuyZrx(ordersAndFillableAmounts, assetBuyAmount);
    } else {
        // find eth and zrx amounts needed to buy
        const ethAndZrxAmountToBuyAsset = findEthAndZrxAmountNeededToBuyAsset(ordersAndFillableAmounts, assetBuyAmount);
        assetEthAmount = ethAndZrxAmountToBuyAsset[0];
        const zrxAmountToBuyAsset = ethAndZrxAmountToBuyAsset[1];
        // find eth amount needed to buy zrx
        zrxEthAmount = findEthAmountNeededToBuyZrx(feeOrdersAndFillableAmounts, zrxAmountToBuyAsset);
    }
    // eth amount needed to buy the affiliate fee
    const affiliateFeeEthAmount = assetEthAmount.multipliedBy(feePercentage).integerValue(BigNumber.ROUND_CEIL);
    // eth amount needed for fees is the sum of affiliate fee and zrx fee
    const feeEthAmount = affiliateFeeEthAmount.plus(zrxEthAmount);
    // eth amount needed in total is the sum of the amount needed for the asset and the amount needed for fees
    const totalEthAmount = assetEthAmount.plus(feeEthAmount);
    return {
        assetEthAmount,
        feeEthAmount,
        totalEthAmount,
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

function findEthAmountNeededToBuyZrx(
    feeOrdersAndFillableAmounts: OrdersAndFillableAmounts,
    zrxBuyAmount: BigNumber,
): BigNumber {
    const { orders, remainingFillableMakerAssetAmounts } = feeOrdersAndFillableAmounts;
    const result = _.reduce(
        orders,
        (acc, order, index) => {
            const { totalEthAmount, remainingZrxBuyAmount } = acc;
            const remainingFillableMakerAssetAmount = remainingFillableMakerAssetAmounts[index];
            const makerFillAmount = BigNumber.min(remainingZrxBuyAmount, remainingFillableMakerAssetAmount);
            const [takerFillAmount, adjustedMakerFillAmount] = orderCalculationUtils.getTakerFillAmountForFeeOrder(
                order,
                makerFillAmount,
            );
            const extraFeeAmount = remainingFillableMakerAssetAmount.isGreaterThanOrEqualTo(adjustedMakerFillAmount)
                ? constants.ZERO_AMOUNT
                : adjustedMakerFillAmount.minus(makerFillAmount);
            return {
                totalEthAmount: totalEthAmount.plus(takerFillAmount),
                remainingZrxBuyAmount: BigNumber.max(
                    constants.ZERO_AMOUNT,
                    remainingZrxBuyAmount.minus(makerFillAmount).plus(extraFeeAmount),
                ),
            };
        },
        {
            totalEthAmount: constants.ZERO_AMOUNT,
            remainingZrxBuyAmount: zrxBuyAmount,
        },
    );
    return result.totalEthAmount;
}

function findEthAndZrxAmountNeededToBuyAsset(
    ordersAndFillableAmounts: OrdersAndFillableAmounts,
    assetBuyAmount: BigNumber,
): [BigNumber, BigNumber] {
    const { orders, remainingFillableMakerAssetAmounts } = ordersAndFillableAmounts;
    const result = _.reduce(
        orders,
        (acc, order, index) => {
            const { totalEthAmount, totalZrxAmount, remainingAssetBuyAmount } = acc;
            const remainingFillableMakerAssetAmount = remainingFillableMakerAssetAmounts[index];
            const makerFillAmount = BigNumber.min(acc.remainingAssetBuyAmount, remainingFillableMakerAssetAmount);
            const takerFillAmount = orderCalculationUtils.getTakerFillAmount(order, makerFillAmount);
            const takerFeeAmount = orderCalculationUtils.getTakerFeeAmount(order, takerFillAmount);
            return {
                totalEthAmount: totalEthAmount.plus(takerFillAmount),
                totalZrxAmount: totalZrxAmount.plus(takerFeeAmount),
                remainingAssetBuyAmount: BigNumber.max(
                    constants.ZERO_AMOUNT,
                    remainingAssetBuyAmount.minus(makerFillAmount),
                ),
            };
        },
        {
            totalEthAmount: constants.ZERO_AMOUNT,
            totalZrxAmount: constants.ZERO_AMOUNT,
            remainingAssetBuyAmount: assetBuyAmount,
        },
    );
    return [result.totalEthAmount, result.totalZrxAmount];
}
