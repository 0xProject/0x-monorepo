import { IERC20BridgeSamplerContract } from '@0x/contract-wrappers';
import { orderCalculationUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import { InsufficientAssetLiquidityError } from '../errors';
import {
    CalculateSwapQuoteOpts,
    MarketBuySwapQuote,
    MarketOperation,
    MarketSellSwapQuote,
    SignedOrderWithFillableAmounts,
    SwapQuote,
    SwapQuoteInfo,
} from '../types';

import { ImproveSwapQuoteUtils } from './improve_swap_quote_utils';
import { marketUtils } from './market_utils';
import { ProtocolFeeUtils } from './protocol_fee_utils';
import { utils } from './utils';

// TODO(dave4506) there is some redundant work in here and improveUtils, worth streamlining
export class SwapQuoteCalculator {
    private readonly _protocolFeeUtils: ProtocolFeeUtils;
    private readonly _improveSwapQuoteUtils: ImproveSwapQuoteUtils;

    constructor(protocolFeeUtils: ProtocolFeeUtils, improveSwapQuoteUtils: ImproveSwapQuoteUtils) {
        this._protocolFeeUtils = protocolFeeUtils;
        this._improveSwapQuoteUtils = improveSwapQuoteUtils;
    }

    public async calculateMarketSellSwapQuoteAsync(
        prunedOrders: SignedOrderWithFillableAmounts[],
        takerAssetFillAmount: BigNumber,
        slippagePercentage: number,
        gasPrice: BigNumber,
        opts: CalculateSwapQuoteOpts,
    ): Promise<MarketSellSwapQuote> {
        return (await this._calculateSwapQuoteAsync(
            prunedOrders,
            takerAssetFillAmount,
            slippagePercentage,
            gasPrice,
            MarketOperation.Sell,
            opts,
        )) as MarketSellSwapQuote;
    }

    public async calculateMarketBuySwapQuoteAsync(
        prunedOrders: SignedOrderWithFillableAmounts[],
        takerAssetFillAmount: BigNumber,
        slippagePercentage: number,
        gasPrice: BigNumber,
        opts: CalculateSwapQuoteOpts,
    ): Promise<MarketBuySwapQuote> {
        return (await this._calculateSwapQuoteAsync(
            prunedOrders,
            takerAssetFillAmount,
            slippagePercentage,
            gasPrice,
            MarketOperation.Buy,
            opts,
        )) as MarketBuySwapQuote;
    }

    private async _calculateSwapQuoteAsync(
        prunedOrders: SignedOrderWithFillableAmounts[],
        assetFillAmount: BigNumber,
        slippagePercentage: number,
        gasPrice: BigNumber,
        operation: MarketOperation,
        opts: CalculateSwapQuoteOpts,
    ): Promise<SwapQuote> {
        const slippageBufferAmount = assetFillAmount.multipliedBy(slippagePercentage).integerValue();

        let resultOrders: SignedOrderWithFillableAmounts[];
        let remainingFillAmount: BigNumber;

        if (operation === MarketOperation.Buy) {
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

        // TODO(dave4506) remove this error handling or refactor it now that we can tap into other sources
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

        if (opts.shouldImproveSwapQuoteWithOtherSources) {
            let improvedResultOrders: SignedOrderWithFillableAmounts[];
            if (operation === MarketOperation.Buy) {
                improvedResultOrders = await this._improveSwapQuoteUtils.improveMarketBuyAsync(
                    resultOrders,
                    assetFillAmount.plus(slippageBufferAmount),
                    opts.improveOrderOpts,
                );

            } else {
                improvedResultOrders = await this._improveSwapQuoteUtils.improveMarketBuyAsync(
                    resultOrders,
                    assetFillAmount.plus(slippageBufferAmount),
                    opts.improveOrderOpts,
                );
            }
            // TODO(dave4506) add analytics?
            resultOrders = improvedResultOrders;
        }

        // assetData information for the result
        const takerAssetData = resultOrders[0].takerAssetData;
        const makerAssetData = resultOrders[0].makerAssetData;

        const bestCaseQuoteInfo = this._calculateQuoteInfo(
            resultOrders,
            assetFillAmount,
            gasPrice,
            operation,
        );
        // in order to calculate the maxRate, reverse the ordersAndFillableAmounts such that they are sorted from worst rate to best rate
        const worstCaseQuoteInfo = this._calculateQuoteInfo(
            _.reverse(_.clone(resultOrders)),
            assetFillAmount,
            gasPrice,
            operation,
        );

        const quoteBase = {
            takerAssetData,
            makerAssetData,
            orders: resultOrders,
            bestCaseQuoteInfo,
            worstCaseQuoteInfo,
            gasPrice,
        };

        if (operation === MarketOperation.Buy) {
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

    // tslint:disable-next-line: prefer-function-over-method
    private _calculateQuoteInfo(
        prunedOrders: SignedOrderWithFillableAmounts[],
        assetFillAmount: BigNumber,
        gasPrice: BigNumber,
        operation: MarketOperation,
    ): SwapQuoteInfo {
        if (operation === MarketOperation.Buy) {
            return this._calculateMarketBuyQuoteInfo(prunedOrders, assetFillAmount, gasPrice);
        } else {
            return this._calculateMarketSellQuoteInfo(prunedOrders, assetFillAmount, gasPrice);
        }
    }

    private _calculateMarketSellQuoteInfo(
        prunedOrders: SignedOrderWithFillableAmounts[],
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
        const protocolFeeInWeiAmount = this._protocolFeeUtils.calculateWorstCaseProtocolFee(prunedOrders, gasPrice);
        return {
            feeTakerAssetAmount: result.totalFeeTakerAssetAmount,
            takerAssetAmount: result.totalTakerAssetAmount,
            totalTakerAssetAmount: result.totalFeeTakerAssetAmount.plus(result.totalTakerAssetAmount),
            makerAssetAmount: result.totalMakerAssetAmount,
            protocolFeeInWeiAmount,
        };
    }

    private _calculateMarketBuyQuoteInfo(
        prunedOrders: SignedOrderWithFillableAmounts[],
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
        const protocolFeeInWeiAmount = this._protocolFeeUtils.calculateWorstCaseProtocolFee(prunedOrders, gasPrice);
        return {
            feeTakerAssetAmount: result.totalFeeTakerAssetAmount,
            takerAssetAmount: result.totalTakerAssetAmount,
            totalTakerAssetAmount: result.totalFeeTakerAssetAmount.plus(result.totalTakerAssetAmount),
            makerAssetAmount: result.totalMakerAssetAmount,
            protocolFeeInWeiAmount,
        };
    }
}

function getTakerAssetAmountBreakDown(
    order: SignedOrderWithFillableAmounts,
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
