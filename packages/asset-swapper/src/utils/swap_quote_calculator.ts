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
} from '../types';

import { marketUtils } from './market_utils';
import { utils } from './utils';

// Calculates a swap quote for orders
export const swapQuoteCalculator = {
    calculateMarketSellSwapQuote(
        prunedOrders: PrunedSignedOrder[],
        takerAssetFillAmount: BigNumber,
        slippagePercentage: number,
        gasPrice: BigNumber,
    ): MarketSellSwapQuote {
        return calculateSwapQuote(
            prunedOrders,
            takerAssetFillAmount,
            slippagePercentage,
            gasPrice,
            MarketOperation.Sell,
        ) as MarketSellSwapQuote;
    },
    calculateMarketBuySwapQuote(
        prunedOrders: PrunedSignedOrder[],
        takerAssetFillAmount: BigNumber,
        slippagePercentage: number,
        gasPrice: BigNumber,
    ): MarketBuySwapQuote {
        return calculateSwapQuote(
            prunedOrders,
            takerAssetFillAmount,
            slippagePercentage,
            gasPrice,
            MarketOperation.Buy,
        ) as MarketBuySwapQuote;
    },
};

function calculateSwapQuote(
    prunedOrders: PrunedSignedOrder[],
    assetFillAmount: BigNumber,
    slippagePercentage: number,
    gasPrice: BigNumber,
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
        gasPrice,
        marketOperation,
    );
    // in order to calculate the maxRate, reverse the ordersAndFillableAmounts such that they are sorted from worst rate to best rate
    const worstCaseQuoteInfo = calculateQuoteInfo(
        _.reverse(resultOrders),
        assetFillAmount,
        gasPrice,
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
    assetFillAmount: BigNumber,
    gasPrice: BigNumber,
    operation: MarketOperation,
): SwapQuoteInfo {
    if (operation === MarketOperation.Buy) {
        return calculateMarketBuyQuoteInfo(
            prunedOrders,
            assetFillAmount,
            gasPrice,
        );
    } else {
        return calculateMarketSellQuoteInfo(
            prunedOrders,
            assetFillAmount,
            gasPrice,
        );
    }
}

function calculateMarketSellQuoteInfo(
    prunedOrders: PrunedSignedOrder[],
    takerAssetSellAmount: BigNumber,
    gasPrice: BigNumber,
): SwapQuoteInfo {
    const result = _.reduce(
        prunedOrders,
        (acc, order) => {
            const {
                totalMakerAssetAmount,
                totalTakerAssetAmount,
                totalFeeTakerAssetAmount,
                remainingTakerAssetFillAmount,
            } = acc;
            const [
                adjustedFillableMakerAssetAmount,
                adjustedFillableTakerAssetAmount,
            ] = utils.getAdjustedFillableMakerAndTakerAmountsFromTakerFees(order);
            const takerAssetAmountWithFees = BigNumber.min(remainingTakerAssetFillAmount, adjustedFillableTakerAssetAmount);
            const { takerAssetAmount, feeTakerAssetAmount } = getTakerAssetAmountBreakDown(order, takerAssetAmountWithFees);
            const makerAssetAmount = takerAssetAmountWithFees
                                        .div(adjustedFillableTakerAssetAmount)
                                        .multipliedBy(adjustedFillableMakerAssetAmount)
                                        .integerValue(BigNumber.ROUND_CEIL);
            return {
                totalMakerAssetAmount: totalMakerAssetAmount.plus(makerAssetAmount),
                totalTakerAssetAmount: totalTakerAssetAmount.plus(takerAssetAmount),
                totalFeeTakerAssetAmount: totalFeeTakerAssetAmount.plus(feeTakerAssetAmount),
                remainingTakerAssetFillAmount: BigNumber.max(
                    constants.ZERO_AMOUNT,
                    remainingTakerAssetFillAmount.minus(takerAssetAmountWithFees),
                ),
            };
        },
        {
            totalMakerAssetAmount: constants.ZERO_AMOUNT,
            totalTakerAssetAmount: constants.ZERO_AMOUNT,
            totalFeeTakerAssetAmount: constants.ZERO_AMOUNT,
            remainingTakerAssetFillAmount: takerAssetSellAmount,
        },
    );
    return {
        feeTakerAssetAmount: result.totalFeeTakerAssetAmount,
        takerAssetAmount: result.totalTakerAssetAmount,
        totalTakerAssetAmount: result.totalFeeTakerAssetAmount.plus(result.totalTakerAssetAmount),
        makerAssetAmount: result.totalMakerAssetAmount,
        protocolFeeInEthAmount: utils.calculateWorstCaseProtocolFee(prunedOrders, gasPrice),
    };
}

function calculateMarketBuyQuoteInfo(
    prunedOrders: PrunedSignedOrder[],
    makerAssetBuyAmount: BigNumber,
    gasPrice: BigNumber,
): SwapQuoteInfo {
    const result = _.reduce(
        prunedOrders,
        (acc, order) => {
            const {
                totalMakerAssetAmount,
                totalTakerAssetAmount,
                totalFeeTakerAssetAmount,
                remainingMakerAssetFillAmount,
            } = acc;
            const [
                adjustedFillableMakerAssetAmount,
                adjustedFillableTakerAssetAmount,
            ] = utils.getAdjustedFillableMakerAndTakerAmountsFromTakerFees(order);
            const makerFillAmount = BigNumber.min(remainingMakerAssetFillAmount, adjustedFillableMakerAssetAmount);
            const takerAssetAmountWithFees = makerFillAmount
                .div(adjustedFillableMakerAssetAmount)
                .multipliedBy(adjustedFillableTakerAssetAmount)
                .integerValue(BigNumber.ROUND_CEIL);
            const { takerAssetAmount, feeTakerAssetAmount } = getTakerAssetAmountBreakDown(order, takerAssetAmountWithFees);
            return {
                totalMakerAssetAmount: totalMakerAssetAmount.plus(makerFillAmount),
                totalTakerAssetAmount: totalTakerAssetAmount.plus(takerAssetAmount),
                totalFeeTakerAssetAmount: totalFeeTakerAssetAmount.plus(feeTakerAssetAmount),
                remainingMakerAssetFillAmount: BigNumber.max(
                    constants.ZERO_AMOUNT,
                    remainingMakerAssetFillAmount.minus(makerFillAmount),
                ),
            };
        },
        {
            totalMakerAssetAmount: constants.ZERO_AMOUNT,
            totalTakerAssetAmount: constants.ZERO_AMOUNT,
            totalFeeTakerAssetAmount: constants.ZERO_AMOUNT,
            remainingMakerAssetFillAmount: makerAssetBuyAmount,
        },
    );
    return {
        feeTakerAssetAmount: result.totalFeeTakerAssetAmount,
        takerAssetAmount: result.totalTakerAssetAmount,
        totalTakerAssetAmount: result.totalFeeTakerAssetAmount.plus(result.totalTakerAssetAmount),
        makerAssetAmount: result.totalMakerAssetAmount,
        protocolFeeInEthAmount: utils.calculateWorstCaseProtocolFee(prunedOrders, gasPrice),
    };
}

function getTakerAssetAmountBreakDown(
    order: PrunedSignedOrder,
    takerAssetAmountWithFees: BigNumber,
): { feeTakerAssetAmount: BigNumber; takerAssetAmount: BigNumber} {
    if (utils.isOrderTakerFeePayableWithTakerAsset(order)) {
        // based on equation takerFillAmountAccountingForFees = takerAssetSellAmount / (1 + takerFee/takerAssetAmount)
        const coefficient = constants.ONE_AMOUNT.div(constants.ONE_AMOUNT.minus(order.takerFee.div(order.takerAssetAmount)));
        const takerAssetAmount = takerAssetAmountWithFees.multipliedBy(coefficient).integerValue(BigNumber.ROUND_CEIL);
        return {
            takerAssetAmount,
            feeTakerAssetAmount: takerAssetAmountWithFees.minus(takerAssetAmount),
        };
    } else if (utils.isOrderTakerFeePayableWithMakerAsset(order)) {
        // based on equation takerFillAmountAccountingForFees = takerAssetSellAmount * (1 - takerFee/makerAssetAmount)
        const coefficient = constants.ONE_AMOUNT.minus(order.takerFee.div(order.makerAssetAmount));
        const takerAssetAmount = takerAssetAmountWithFees.multipliedBy(coefficient).integerValue(BigNumber.ROUND_CEIL);
        return {
            takerAssetAmount,
            feeTakerAssetAmount: takerAssetAmountWithFees.minus(takerAssetAmount),
        };
    }
    return {
        feeTakerAssetAmount: constants.ZERO_AMOUNT,
        takerAssetAmount: takerAssetAmountWithFees,
    };
}
