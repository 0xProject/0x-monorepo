import { marketUtils, orderCalculationUtils, SignedOrder } from '@0x/order-utils';
import { MarketOperation } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import { InsufficientAssetLiquidityError } from '../errors';
import {
    MarketBuySwapQuote,
    MarketSellSwapQuote,
    OrdersAndFillableAmounts,
    SwapQuote,
    SwapQuoteInfo,
    SwapQuoterError,
} from '../types';

// Calculates a swap quote for orders
export const swapQuoteCalculator = {
    calculateMarketSellSwapQuote(
        ordersAndFillableAmounts: OrdersAndFillableAmounts,
        feeOrdersAndFillableAmounts: OrdersAndFillableAmounts,
        takerAssetFillAmount: BigNumber,
        slippagePercentage: number,
        isMakerAssetZrxToken: boolean,
        shouldDisableFeeOrderCalculations: boolean,
    ): MarketSellSwapQuote {
        return calculateSwapQuote(
            ordersAndFillableAmounts,
            feeOrdersAndFillableAmounts,
            takerAssetFillAmount,
            slippagePercentage,
            isMakerAssetZrxToken,
            shouldDisableFeeOrderCalculations,
            MarketOperation.Sell,
        ) as MarketSellSwapQuote;
    },
    calculateMarketBuySwapQuote(
        ordersAndFillableAmounts: OrdersAndFillableAmounts,
        feeOrdersAndFillableAmounts: OrdersAndFillableAmounts,
        makerAssetFillAmount: BigNumber,
        slippagePercentage: number,
        isMakerAssetZrxToken: boolean,
        shouldDisableFeeOrderCalculations: boolean,
    ): MarketBuySwapQuote {
        return calculateSwapQuote(
            ordersAndFillableAmounts,
            feeOrdersAndFillableAmounts,
            makerAssetFillAmount,
            slippagePercentage,
            isMakerAssetZrxToken,
            shouldDisableFeeOrderCalculations,
            MarketOperation.Buy,
        ) as MarketBuySwapQuote;
    },
};

function calculateSwapQuote(
    ordersAndFillableAmounts: OrdersAndFillableAmounts,
    feeOrdersAndFillableAmounts: OrdersAndFillableAmounts,
    assetFillAmount: BigNumber,
    slippagePercentage: number,
    isMakerAssetZrxToken: boolean,
    shouldDisableFeeOrderCalculations: boolean,
    marketOperation: MarketOperation,
): SwapQuote {
    const orders = ordersAndFillableAmounts.orders;
    const remainingFillableMakerAssetAmounts = ordersAndFillableAmounts.remainingFillableMakerAssetAmounts;
    const remainingFillableTakerAssetAmounts = remainingFillableMakerAssetAmounts.map(
        (makerAssetAmount: BigNumber, index: number) => {
            return orderCalculationUtils.getTakerFillAmount(orders[index], makerAssetAmount);
        },
    );
    const feeOrders = feeOrdersAndFillableAmounts.orders;
    const remainingFillableFeeAmounts = feeOrdersAndFillableAmounts.remainingFillableMakerAssetAmounts;

    const slippageBufferAmount = assetFillAmount.multipliedBy(slippagePercentage).integerValue();

    let resultOrders: SignedOrder[];
    let remainingFillAmount: BigNumber;
    let ordersRemainingFillableMakerAssetAmounts: BigNumber[];

    if (marketOperation === MarketOperation.Buy) {
        // find the orders that cover the desired assetBuyAmount (with slippage)
        ({
            resultOrders,
            remainingFillAmount,
            ordersRemainingFillableMakerAssetAmounts,
        } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(orders, assetFillAmount, {
            remainingFillableMakerAssetAmounts,
            slippageBufferAmount,
        }));
    } else {
        let ordersRemainingFillableTakerAssetAmounts: BigNumber[];
        // find the orders that cover the desired assetBuyAmount (with slippage)
        ({
            resultOrders,
            remainingFillAmount,
            ordersRemainingFillableTakerAssetAmounts,
        } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(orders, assetFillAmount, {
            remainingFillableTakerAssetAmounts,
            slippageBufferAmount,
        }));

        ordersRemainingFillableMakerAssetAmounts = _.map(
            ordersRemainingFillableTakerAssetAmounts,
            (takerAssetAmount: BigNumber, index: number) => {
                return orderCalculationUtils.getMakerFillAmount(resultOrders[index], takerAssetAmount);
            },
        );
    }

    // if we do not have enough orders to cover the desired assetBuyAmount, throw
    if (remainingFillAmount.gt(constants.ZERO_AMOUNT)) {
        // We needed the amount they requested to buy, plus the amount for slippage
        const totalAmountRequested = assetFillAmount.plus(slippageBufferAmount);
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
    if (!shouldDisableFeeOrderCalculations && !isMakerAssetZrxToken) {
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
            throw new Error(SwapQuoterError.InsufficientZrxLiquidity);
        }
        resultFeeOrders = feeOrdersAndRemainingFeeAmount.resultFeeOrders;
        feeOrdersRemainingFillableMakerAssetAmounts =
            feeOrdersAndRemainingFeeAmount.feeOrdersRemainingFillableMakerAssetAmounts;
    }

    // assetData information for the result
    const takerAssetData = orders[0].takerAssetData;
    const makerAssetData = orders[0].makerAssetData;

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
        assetFillAmount,
        isMakerAssetZrxToken,
        shouldDisableFeeOrderCalculations,
        marketOperation,
    );
    // in order to calculate the maxRate, reverse the ordersAndFillableAmounts such that they are sorted from worst rate to best rate
    const worstCaseQuoteInfo = calculateQuoteInfo(
        reverseOrdersAndFillableAmounts(trimmedOrdersAndFillableAmounts),
        reverseOrdersAndFillableAmounts(trimmedFeeOrdersAndFillableAmounts),
        assetFillAmount,
        isMakerAssetZrxToken,
        shouldDisableFeeOrderCalculations,
        marketOperation,
    );

    const quoteBase = {
        takerAssetData,
        makerAssetData,
        orders: resultOrders,
        feeOrders: resultFeeOrders,
        bestCaseQuoteInfo,
        worstCaseQuoteInfo,
    };

    if (marketOperation === MarketOperation.Buy) {
        return {
            ...quoteBase,
            type: MarketOperation.Buy,
            makerAssetFillAmount: assetFillAmount,
        };
    } else {
        return {
            ...quoteBase,
            type: MarketOperation.Sell,
            takerAssetFillAmount: assetFillAmount,
        };
    }
}

function calculateQuoteInfo(
    ordersAndFillableAmounts: OrdersAndFillableAmounts,
    feeOrdersAndFillableAmounts: OrdersAndFillableAmounts,
    tokenAmount: BigNumber,
    isMakerAssetZrxToken: boolean,
    shouldDisableFeeOrderCalculations: boolean,
    marketOperation: MarketOperation,
): SwapQuoteInfo {
    // find the total eth and zrx needed to buy assetAmount from the resultOrders from left to right
    let makerTokenAmount = marketOperation === MarketOperation.Buy ? tokenAmount : constants.ZERO_AMOUNT;
    let takerTokenAmount = marketOperation === MarketOperation.Sell ? tokenAmount : constants.ZERO_AMOUNT;
    let zrxTakerTokenAmount = constants.ZERO_AMOUNT;

    if (isMakerAssetZrxToken) {
        if (marketOperation === MarketOperation.Buy) {
            takerTokenAmount = findTakerTokenAmountNeededToBuyZrx(ordersAndFillableAmounts, makerTokenAmount);
        } else {
            makerTokenAmount = findZrxTokenAmountFromSellingTakerTokenAmount(
                ordersAndFillableAmounts,
                takerTokenAmount,
            );
        }
    } else {
        const findTokenAndZrxAmount =
            marketOperation === MarketOperation.Buy
                ? findTakerTokenAndZrxAmountNeededToBuyAsset
                : findMakerTokenAmountReceivedAndZrxAmountNeededToSellAsset;
        // find eth and zrx amounts needed to buy
        const tokenAndZrxAmountToBuyAsset = findTokenAndZrxAmount(
            ordersAndFillableAmounts,
            marketOperation === MarketOperation.Buy ? makerTokenAmount : takerTokenAmount,
        );
        if (marketOperation === MarketOperation.Buy) {
            takerTokenAmount = tokenAndZrxAmountToBuyAsset[0];
        } else {
            makerTokenAmount = tokenAndZrxAmountToBuyAsset[0];
        }
        const zrxAmountToBuyAsset = tokenAndZrxAmountToBuyAsset[1];
        // find eth amount needed to buy zrx
        zrxTakerTokenAmount = shouldDisableFeeOrderCalculations ? constants.ZERO_AMOUNT : findTakerTokenAmountNeededToBuyZrx(feeOrdersAndFillableAmounts, zrxAmountToBuyAsset);
    }

    const feeTakerTokenAmount = zrxTakerTokenAmount;

    // eth amount needed in total is the sum of the amount needed for the asset and the amount needed for fees
    const totalTakerTokenAmount = takerTokenAmount.plus(feeTakerTokenAmount);
    return {
        makerTokenAmount,
        takerTokenAmount,
        feeTakerTokenAmount,
        totalTakerTokenAmount,
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

function findZrxTokenAmountFromSellingTakerTokenAmount(
    feeOrdersAndFillableAmounts: OrdersAndFillableAmounts,
    takerAssetSellAmount: BigNumber,
): BigNumber {
    const { orders, remainingFillableMakerAssetAmounts } = feeOrdersAndFillableAmounts;
    const result = _.reduce(
        orders,
        (acc, order, index) => {
            const { totalZrxTokenAmount, remainingTakerAssetFillAmount } = acc;
            const remainingFillableMakerAssetAmount = remainingFillableMakerAssetAmounts[index];
            const remainingFillableTakerAssetAmount = orderCalculationUtils.getTakerFillAmount(
                order,
                remainingFillableMakerAssetAmount,
            );
            const takerFillAmount = BigNumber.min(remainingTakerAssetFillAmount, remainingFillableTakerAssetAmount);
            const makerFillAmount = orderCalculationUtils.getMakerFillAmount(order, takerFillAmount);
            const feeAmount = orderCalculationUtils.getTakerFeeAmount(order, takerFillAmount);
            return {
                totalZrxTokenAmount: totalZrxTokenAmount.plus(makerFillAmount).minus(feeAmount),
                remainingTakerAssetFillAmount: BigNumber.max(
                    constants.ZERO_AMOUNT,
                    remainingTakerAssetFillAmount.minus(takerFillAmount),
                ),
            };
        },
        {
            totalZrxTokenAmount: constants.ZERO_AMOUNT,
            remainingTakerAssetFillAmount: takerAssetSellAmount,
        },
    );
    return result.totalZrxTokenAmount;
}

function findTakerTokenAmountNeededToBuyZrx(
    feeOrdersAndFillableAmounts: OrdersAndFillableAmounts,
    zrxBuyAmount: BigNumber,
): BigNumber {
    const { orders, remainingFillableMakerAssetAmounts } = feeOrdersAndFillableAmounts;
    const result = _.reduce(
        orders,
        (acc, order, index) => {
            const { totalTakerTokenAmount, remainingZrxBuyAmount } = acc;
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
                totalTakerTokenAmount: totalTakerTokenAmount.plus(takerFillAmount),
                remainingZrxBuyAmount: BigNumber.max(
                    constants.ZERO_AMOUNT,
                    remainingZrxBuyAmount.minus(makerFillAmount).plus(extraFeeAmount),
                ),
            };
        },
        {
            totalTakerTokenAmount: constants.ZERO_AMOUNT,
            remainingZrxBuyAmount: zrxBuyAmount,
        },
    );
    return result.totalTakerTokenAmount;
}

function findTakerTokenAndZrxAmountNeededToBuyAsset(
    ordersAndFillableAmounts: OrdersAndFillableAmounts,
    makerAssetBuyAmount: BigNumber,
): [BigNumber, BigNumber] {
    const { orders, remainingFillableMakerAssetAmounts } = ordersAndFillableAmounts;
    const result = _.reduce(
        orders,
        (acc, order, index) => {
            const { totalTakerTokenAmount, totalZrxAmount, remainingmakerAssetFillAmount } = acc;
            const remainingFillableMakerAssetAmount = remainingFillableMakerAssetAmounts[index];
            const makerFillAmount = BigNumber.min(acc.remainingmakerAssetFillAmount, remainingFillableMakerAssetAmount);
            const takerFillAmount = orderCalculationUtils.getTakerFillAmount(order, makerFillAmount);
            const takerFeeAmount = orderCalculationUtils.getTakerFeeAmount(order, takerFillAmount);
            return {
                totalTakerTokenAmount: totalTakerTokenAmount.plus(takerFillAmount),
                totalZrxAmount: totalZrxAmount.plus(takerFeeAmount),
                remainingmakerAssetFillAmount: BigNumber.max(
                    constants.ZERO_AMOUNT,
                    remainingmakerAssetFillAmount.minus(makerFillAmount),
                ),
            };
        },
        {
            totalTakerTokenAmount: constants.ZERO_AMOUNT,
            totalZrxAmount: constants.ZERO_AMOUNT,
            remainingmakerAssetFillAmount: makerAssetBuyAmount,
        },
    );
    return [result.totalTakerTokenAmount, result.totalZrxAmount];
}

function findMakerTokenAmountReceivedAndZrxAmountNeededToSellAsset(
    ordersAndFillableAmounts: OrdersAndFillableAmounts,
    takerAssetSellAmount: BigNumber,
): [BigNumber, BigNumber] {
    const { orders, remainingFillableMakerAssetAmounts } = ordersAndFillableAmounts;
    const result = _.reduce(
        orders,
        (acc, order, index) => {
            const { totalMakerTokenAmount, totalZrxAmount, remainingTakerAssetFillAmount } = acc;
            const remainingFillableMakerAssetAmount = remainingFillableMakerAssetAmounts[index];
            const remainingFillableTakerAssetAmount = orderCalculationUtils.getTakerFillAmount(
                order,
                remainingFillableMakerAssetAmount,
            );
            const takerFillAmount = BigNumber.min(acc.remainingTakerAssetFillAmount, remainingFillableTakerAssetAmount);
            const makerFillAmount = orderCalculationUtils.getMakerFillAmount(order, takerFillAmount);
            const takerFeeAmount = orderCalculationUtils.getTakerFeeAmount(order, takerFillAmount);
            return {
                totalMakerTokenAmount: totalMakerTokenAmount.plus(makerFillAmount),
                totalZrxAmount: totalZrxAmount.plus(takerFeeAmount),
                remainingTakerAssetFillAmount: BigNumber.max(
                    constants.ZERO_AMOUNT,
                    remainingTakerAssetFillAmount.minus(takerFillAmount),
                ),
            };
        },
        {
            totalMakerTokenAmount: constants.ZERO_AMOUNT,
            totalZrxAmount: constants.ZERO_AMOUNT,
            remainingTakerAssetFillAmount: takerAssetSellAmount,
        },
    );
    return [result.totalMakerTokenAmount, result.totalZrxAmount];
}
