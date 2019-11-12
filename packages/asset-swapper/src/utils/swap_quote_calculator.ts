import { orderCalculationUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import { InsufficientAssetLiquidityError } from '../errors';
import {
    MarketBuySwapQuote,
    MarketOperation,
    MarketSellSwapQuote,
    PrunedSignedOrder,
    SwapQuote,
    SwapQuoteInfo,
    SwapQuoterError,
} from '../types';

import { marketUtils } from './market_utils';

// Calculates a swap quote for orders
export const swapQuoteCalculator = {
    calculateMarketSellSwapQuote(
        prunedOrders: PrunedSignedOrder[],
        takerAssetFillAmount: BigNumber,
        slippagePercentage: number,
    ): MarketSellSwapQuote {
        return calculateSwapQuote(
            prunedOrders,
            takerAssetFillAmount,
            slippagePercentage,
            MarketOperation.Sell,
        ) as MarketSellSwapQuote;
    },
    calculateMarketBuySwapQuote(
        prunedOrders: PrunedSignedOrder[],
        takerAssetFillAmount: BigNumber,
        slippagePercentage: number,
    ): MarketBuySwapQuote {
        return calculateSwapQuote(
            prunedOrders,
            takerAssetFillAmount,
            slippagePercentage,
            MarketOperation.Buy,
        ) as MarketBuySwapQuote;
    },
};

function calculateSwapQuote(
    prunedOrders: PrunedSignedOrder[],
    assetFillAmount: BigNumber,
    slippagePercentage: number,
    marketOperation: MarketOperation,
): SwapQuote {
    const slippageBufferAmount = assetFillAmount.multipliedBy(slippagePercentage).integerValue();

    let resultOrders: PrunedSignedOrder[];
    let remainingFillAmount: BigNumber;

    if (marketOperation === MarketOperation.Buy) {
        // find the orders that cover the desired assetBuyAmount (with slippage)
        ({
            resultOrders,
            remainingFillAmount,
        } = marketUtils.findOrdersThatCoverMakerAssetBuyAmount(prunedOrders, assetFillAmount, slippageBufferAmount));
    } else {
        // find the orders that cover the desired assetBuyAmount (with slippage)
        ({
            resultOrders,
            remainingFillAmount,
        } = marketUtils.findOrdersThatCoverTakerAssetSellAmount(prunedOrders, assetFillAmount, slippageBufferAmount));
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

    // assetData information for the result
    const takerAssetData = resultOrders[0].takerAssetData;
    const makerAssetData = resultOrders[0].makerAssetData;

    const bestCaseQuoteInfo = calculateQuoteInfo(
        resultOrders,
        assetFillAmount,
        marketOperation,
    );
    // in order to calculate the maxRate, reverse the ordersAndFillableAmounts such that they are sorted from worst rate to best rate
    const worstCaseQuoteInfo = calculateQuoteInfo(
        _.reverse(resultOrders),
        assetFillAmount,
        marketOperation,
    );

    const quoteBase = {
        takerAssetData,
        makerAssetData,
        orders: resultOrders,
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
    prunedOrders: PrunedSignedOrder[],
    tokenAmount: BigNumber,
    marketOperation: MarketOperation,
): SwapQuoteInfo {
    // find the total eth and zrx needed to buy assetAmount from the resultOrders from left to right
    let makerTokenAmount = marketOperation === MarketOperation.Buy ? tokenAmount : constants.ZERO_AMOUNT;
    let takerTokenAmount = marketOperation === MarketOperation.Sell ? tokenAmount : constants.ZERO_AMOUNT;
    let feeTakerTokenAmount = constants.ZERO_AMOUNT;

    if (marketOperation === MarketOperation.Buy) {
       ({ takerTokenAmount, feeTakerTokenAmount } = findTakerTokenAndTakerFeeAmountNeededToBuyMakerAsset(prunedOrders, makerTokenAmount));
    } else {
        ({ adjustedTakerTokenAmount: takerTokenAmount, feeTakerTokenAmount, makerTokenAmount } = findMakerAssetAndTakerAssetAmountFromSellingTakerAsset(
            prunedOrders,
            takerTokenAmount,
        ));
    }

    const totalTakerTokenAmount = takerTokenAmount.plus(feeTakerTokenAmount);

    return {
        makerTokenAmount,
        takerTokenAmount,
        feeTakerTokenAmount,
        totalTakerTokenAmount,
    };
}

function findMakerAssetAndTakerAssetAmountFromSellingTakerAsset(
    prunedOrders: PrunedSignedOrder[],
    takerAssetSellAmount: BigNumber,
): { feeTakerTokenAmount: BigNumber; adjustedTakerTokenAmount: BigNumber; makerTokenAmount: BigNumber } {
    const result = _.reduce(
        prunedOrders,
        (acc, order) => {
            const {
                totalMakerAssetAmount,
                totalAdjustedTakerAssetAmount,
                totalFeeTakerTokenAmount,
                remainingTakerAssetFillAmount,
             } = acc;
            const takerFillAmount = BigNumber.min(remainingTakerAssetFillAmount, order.remainingTakerAssetAmount);
            const takerFeeAmount = orderCalculationUtils.getTakerFeeAmount(order, takerFillAmount);
            const takerAssetAmountForTakerFee = orderCalculationUtils.getTakerFillAmount(order, takerFeeAmount);
            const makerFillAmount = orderCalculationUtils.getMakerFillAmount(order, takerFillAmount);
            const adjustedMakerFillAmount = makerFillAmount.minus(takerFeeAmount);
            const adjustedTakerFillAmount = takerFillAmount.minus(takerAssetAmountForTakerFee);
            return {
                totalMakerAssetAmount: totalMakerAssetAmount.plus(adjustedMakerFillAmount),
                totalAdjustedTakerAssetAmount: totalAdjustedTakerAssetAmount.plus(adjustedTakerFillAmount),
                totalFeeTakerTokenAmount: totalFeeTakerTokenAmount.plus(takerAssetAmountForTakerFee),
                remainingTakerAssetFillAmount: BigNumber.max(
                    constants.ZERO_AMOUNT,
                    remainingTakerAssetFillAmount.minus(takerFillAmount),
                ),
            };
        },
        {
            totalMakerAssetAmount: constants.ZERO_AMOUNT,
            totalAdjustedTakerAssetAmount: constants.ZERO_AMOUNT,
            totalFeeTakerTokenAmount: constants.ZERO_AMOUNT,
            remainingTakerAssetFillAmount: takerAssetSellAmount,
        },
    );
    return {
        feeTakerTokenAmount: result.totalFeeTakerTokenAmount,
        adjustedTakerTokenAmount: result.totalAdjustedTakerAssetAmount,
        makerTokenAmount: result.totalMakerAssetAmount,
    };
}

function findTakerTokenAndTakerFeeAmountNeededToBuyMakerAsset(
    prunedOrders: PrunedSignedOrder[],
    makerAssetBuyAmount: BigNumber,
): { feeTakerTokenAmount: BigNumber; takerTokenAmount: BigNumber } {
    const result = _.reduce(
        prunedOrders,
        (acc, order) => {
            const { totalTakerTokenAmount, totalFeeTakerTokenAmount, remainingMakerAssetBuyAmount } = acc;
            let makerFillAmountWithTakerFees = order.remainingMakerAssetAmount;
            if (remainingMakerAssetBuyAmount.lt(makerFillAmountWithTakerFees)) {
                // retreives the total makerAsset we will be swapping for, along with taker fees
                const adjustedRemainingMakerAssetBuyAmount = getAdjustedMakerAssetAmountWithTakerFees(order, remainingMakerAssetBuyAmount);
                // if remaining amount + taker fees are fillable with the order, set makerFillAmountWithTakerFees to adjusted
                if (adjustedRemainingMakerAssetBuyAmount.lt(makerFillAmountWithTakerFees)) {
                    makerFillAmountWithTakerFees = adjustedRemainingMakerAssetBuyAmount;
                }
            }
            const takerFillAmountWithFees = orderCalculationUtils.getTakerFillAmount(order, makerFillAmountWithTakerFees);
            const takerFee = orderCalculationUtils.getTakerFeeAmount(order, takerFillAmountWithFees);
            const adjustedMakerFillAmount = makerFillAmountWithTakerFees.minus(takerFee);
            const takerAssetAmountForTakerFee = orderCalculationUtils.getTakerFillAmount(order, takerFee);
            const adjustedTakerFillAmount = takerFillAmountWithFees.minus(takerAssetAmountForTakerFee);
            return {
                totalTakerTokenAmount: totalTakerTokenAmount.plus(adjustedTakerFillAmount),
                totalFeeTakerTokenAmount: totalFeeTakerTokenAmount.plus(takerAssetAmountForTakerFee),
                remainingMakerAssetBuyAmount: BigNumber.max(
                    constants.ZERO_AMOUNT,
                    remainingMakerAssetBuyAmount.minus(adjustedMakerFillAmount),
                ),
            };
        },
        {
            totalFeeTakerTokenAmount: constants.ZERO_AMOUNT,
            totalTakerTokenAmount: constants.ZERO_AMOUNT,
            remainingMakerAssetBuyAmount: makerAssetBuyAmount,
        },
    );
    return {
        feeTakerTokenAmount: result.totalFeeTakerTokenAmount,
        takerTokenAmount: result.totalTakerTokenAmount,
    };
}

function getAdjustedMakerAssetAmountWithTakerFees(
    order: PrunedSignedOrder,
    makerAssetBuyAmount: BigNumber,
): BigNumber {
    // based on equation makerFillAmountWithFees = makerAssetBuyAmount / (1 - takerFee/makerAssetAmount)
    const denominator = constants.ONE_AMOUNT.minus(order.takerFee.div(order.makerAssetAmount));
    const makerAssetBuyAmountWithTakerFees = makerAssetBuyAmount.div(denominator).integerValue(BigNumber.ROUND_CEIL);
    return makerAssetBuyAmountWithTakerFees;
}
