import { orderCalculationUtils } from '@0x/order-utils';
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
import { ProtocolFeeUtils } from './protocol_fee_utils';
import { utils } from './utils';

// Calculates a swap quote for orders
export const swapQuoteCalculator = {
    async calculateMarketSellSwapQuoteAsync(
        prunedOrders: PrunedSignedOrder[],
        takerAssetFillAmount: BigNumber,
        slippagePercentage: number,
        gasPrice: BigNumber,
        protocolFeeUtils: ProtocolFeeUtils,
    ): Promise<MarketSellSwapQuote> {
        return (await calculateSwapQuoteAsync(
            prunedOrders,
            takerAssetFillAmount,
            slippagePercentage,
            gasPrice,
            protocolFeeUtils,
            MarketOperation.Sell,
        )) as MarketSellSwapQuote;
    },
    async calculateMarketBuySwapQuoteAsync(
        prunedOrders: PrunedSignedOrder[],
        takerAssetFillAmount: BigNumber,
        slippagePercentage: number,
        gasPrice: BigNumber,
        protocolFeeUtils: ProtocolFeeUtils,
    ): Promise<MarketBuySwapQuote> {
        return (await calculateSwapQuoteAsync(
            prunedOrders,
            takerAssetFillAmount,
            slippagePercentage,
            gasPrice,
            protocolFeeUtils,
            MarketOperation.Buy,
        )) as MarketBuySwapQuote;
    },
};

async function calculateSwapQuoteAsync(
    prunedOrders: PrunedSignedOrder[],
    assetFillAmount: BigNumber,
    slippagePercentage: number,
    gasPrice: BigNumber,
    protocolFeeUtils: ProtocolFeeUtils,
    marketOperation: MarketOperation,
): Promise<SwapQuote> {
    const slippageBufferAmount = assetFillAmount.multipliedBy(slippagePercentage).integerValue();

    let resultOrders: PrunedSignedOrder[];
    let remainingFillAmount: BigNumber;

    if (marketOperation === MarketOperation.Buy) {
        // find the orders that cover the desired assetBuyAmount (with slippage)
        ({ resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
            prunedOrders,
            assetFillAmount,
            slippageBufferAmount,
        ));
    } else {
        // find the orders that cover the desired assetBuyAmount (with slippage)
        ({ resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
            prunedOrders,
            assetFillAmount,
            slippageBufferAmount,
        ));
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

    const bestCaseQuoteInfo = await calculateQuoteInfoAsync(
        resultOrders,
        assetFillAmount,
        gasPrice,
        protocolFeeUtils,
        marketOperation,
    );
    // in order to calculate the maxRate, reverse the ordersAndFillableAmounts such that they are sorted from worst rate to best rate
    const worstCaseQuoteInfo = await calculateQuoteInfoAsync(
        _.reverse(_.clone(resultOrders)),
        assetFillAmount,
        gasPrice,
        protocolFeeUtils,
        marketOperation,
    );

    const quoteBase = {
        takerAssetData,
        makerAssetData,
        orders: resultOrders,
        bestCaseQuoteInfo,
        worstCaseQuoteInfo,
        gasPrice,
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

async function calculateQuoteInfoAsync(
    prunedOrders: PrunedSignedOrder[],
    assetFillAmount: BigNumber,
    gasPrice: BigNumber,
    protocolFeeUtils: ProtocolFeeUtils,
    operation: MarketOperation,
): Promise<SwapQuoteInfo> {
    if (operation === MarketOperation.Buy) {
        return calculateMarketBuyQuoteInfoAsync(prunedOrders, assetFillAmount, gasPrice, protocolFeeUtils);
    } else {
        return calculateMarketSellQuoteInfoAsync(prunedOrders, assetFillAmount, gasPrice, protocolFeeUtils);
    }
}

async function calculateMarketSellQuoteInfoAsync(
    prunedOrders: PrunedSignedOrder[],
    takerAssetSellAmount: BigNumber,
    gasPrice: BigNumber,
    protocolFeeUtils: ProtocolFeeUtils,
): Promise<SwapQuoteInfo> {
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
            const takerAssetAmountWithFees = BigNumber.min(
                remainingTakerAssetFillAmount,
                adjustedFillableTakerAssetAmount,
            );
            const { takerAssetAmount, feeTakerAssetAmount } = getTakerAssetAmountBreakDown(
                order,
                takerAssetAmountWithFees,
            );
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
    const protocolFeeInWeiAmount = await protocolFeeUtils.calculateWorstCaseProtocolFeeAsync(prunedOrders, gasPrice);
    return {
        feeTakerAssetAmount: result.totalFeeTakerAssetAmount,
        takerAssetAmount: result.totalTakerAssetAmount,
        totalTakerAssetAmount: result.totalFeeTakerAssetAmount.plus(result.totalTakerAssetAmount),
        makerAssetAmount: result.totalMakerAssetAmount,
        protocolFeeInWeiAmount,
    };
}

async function calculateMarketBuyQuoteInfoAsync(
    prunedOrders: PrunedSignedOrder[],
    makerAssetBuyAmount: BigNumber,
    gasPrice: BigNumber,
    protocolFeeUtils: ProtocolFeeUtils,
): Promise<SwapQuoteInfo> {
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
            const { takerAssetAmount, feeTakerAssetAmount } = getTakerAssetAmountBreakDown(
                order,
                takerAssetAmountWithFees,
            );
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
    const protocolFeeInWeiAmount = await protocolFeeUtils.calculateWorstCaseProtocolFeeAsync(prunedOrders, gasPrice);
    return {
        feeTakerAssetAmount: result.totalFeeTakerAssetAmount,
        takerAssetAmount: result.totalTakerAssetAmount,
        totalTakerAssetAmount: result.totalFeeTakerAssetAmount.plus(result.totalTakerAssetAmount),
        makerAssetAmount: result.totalMakerAssetAmount,
        protocolFeeInWeiAmount,
    };
}

function getTakerAssetAmountBreakDown(
    order: PrunedSignedOrder,
    takerAssetAmountWithFees: BigNumber,
): { feeTakerAssetAmount: BigNumber; takerAssetAmount: BigNumber } {
    if (utils.isOrderTakerFeePayableWithTakerAsset(order)) {
        const adjustedTakerAssetAmount = order.takerAssetAmount.plus(order.takerFee);
        const filledRatio = takerAssetAmountWithFees.div(adjustedTakerAssetAmount);
        const takerAssetAmount = filledRatio.multipliedBy(order.takerAssetAmount).integerValue(BigNumber.ROUND_CEIL);
        return {
            takerAssetAmount,
            feeTakerAssetAmount: takerAssetAmountWithFees.minus(takerAssetAmount),
        };
    } else if (utils.isOrderTakerFeePayableWithMakerAsset(order)) {
        if (takerAssetAmountWithFees.isZero()) {
            return {
                takerAssetAmount: constants.ZERO_AMOUNT,
                feeTakerAssetAmount: constants.ZERO_AMOUNT,
            };
        }
        const takerFeeAmount = orderCalculationUtils.getTakerFeeAmount(order, takerAssetAmountWithFees);
        const makerAssetFillAmount = orderCalculationUtils.getMakerFillAmount(order, takerAssetAmountWithFees);
        const takerAssetAmount = takerFeeAmount
            .div(makerAssetFillAmount)
            .multipliedBy(takerAssetAmountWithFees)
            .integerValue(BigNumber.ROUND_CEIL);
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
