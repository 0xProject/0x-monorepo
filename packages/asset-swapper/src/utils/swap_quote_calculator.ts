import { orderCalculationUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalculateSwapQuoteOpts,
    MarketBuySwapQuote,
    MarketOperation,
    MarketSellSwapQuote,
    SignedOrderWithFillableAmounts,
    SwapQuote,
    SwapQuoteInfo,
} from '../types';

import { fillableAmountsUtils } from './fillable_amounts_utils';
import { MarketOperationUtils } from './market_operation_utils';
import { ProtocolFeeUtils } from './protocol_fee_utils';
import { utils } from './utils';

// TODO(dave4506) How do we want to reintroduce InsufficientAssetLiquidityError?
export class SwapQuoteCalculator {
    private readonly _protocolFeeUtils: ProtocolFeeUtils;
    private readonly _marketOperationUtils: MarketOperationUtils;

    constructor(protocolFeeUtils: ProtocolFeeUtils, marketOperationUtils: MarketOperationUtils) {
        this._protocolFeeUtils = protocolFeeUtils;
        this._marketOperationUtils = marketOperationUtils;
    }

    public async calculateMarketSellSwapQuoteAsync(
        prunedOrders: SignedOrder[],
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
        prunedOrders: SignedOrder[],
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
        prunedOrders: SignedOrder[],
        assetFillAmount: BigNumber,
        slippagePercentage: number,
        gasPrice: BigNumber,
        operation: MarketOperation,
        opts: CalculateSwapQuoteOpts,
    ): Promise<SwapQuote> {
        // since prunedOrders do not have fillState, we will add a buffer of fillable orders to consider that some native are orders are partially filled

        const slippageBufferAmount = assetFillAmount.multipliedBy(slippagePercentage).integerValue();
        let resultOrders: SignedOrderWithFillableAmounts[] = [];

        if (operation === MarketOperation.Buy) {
            resultOrders = await this._marketOperationUtils.getMarketBuyOrdersAsync(
                prunedOrders,
                assetFillAmount.plus(slippageBufferAmount),
                opts,
            );
        } else {
            resultOrders = await this._marketOperationUtils.getMarketSellOrdersAsync(
                prunedOrders,
                assetFillAmount.plus(slippageBufferAmount),
                opts,
            );
        }

        // assetData information for the result
        const takerAssetData = resultOrders[0].takerAssetData;
        const makerAssetData = resultOrders[0].makerAssetData;

        const bestCaseQuoteInfo = await this._calculateQuoteInfoAsync(resultOrders, assetFillAmount, gasPrice, operation);
        // in order to calculate the maxRate, reverse the ordersAndFillableAmounts such that they are sorted from worst rate to best rate
        const worstCaseQuoteInfo = await this._calculateQuoteInfoAsync(
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
    private async _calculateQuoteInfoAsync(
        prunedOrders: SignedOrderWithFillableAmounts[],
        assetFillAmount: BigNumber,
        gasPrice: BigNumber,
        operation: MarketOperation,
    ): Promise<SwapQuoteInfo> {
        if (operation === MarketOperation.Buy) {
            return this._calculateMarketBuyQuoteInfoAsync(prunedOrders, assetFillAmount, gasPrice);
        } else {
            return this._calculateMarketSellQuoteInfoAsync(prunedOrders, assetFillAmount, gasPrice);
        }
    }

    private async _calculateMarketSellQuoteInfoAsync(
        prunedOrders: SignedOrderWithFillableAmounts[],
        takerAssetSellAmount: BigNumber,
        gasPrice: BigNumber,
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
                const adjustedFillableMakerAssetAmount = fillableAmountsUtils.getMakerAssetAmountSwappedAfterFees(
                    order,
                );
                const adjustedFillableTakerAssetAmount = fillableAmountsUtils.getTakerAssetAmountSwappedAfterFees(
                    order,
                );
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
        const protocolFeeInWeiAmount = await this._protocolFeeUtils.calculateWorstCaseProtocolFeeAsync(prunedOrders, gasPrice);
        return {
            feeTakerAssetAmount: result.totalFeeTakerAssetAmount,
            takerAssetAmount: result.totalTakerAssetAmount,
            totalTakerAssetAmount: result.totalFeeTakerAssetAmount.plus(result.totalTakerAssetAmount),
            makerAssetAmount: result.totalMakerAssetAmount,
            protocolFeeInWeiAmount,
        };
    }

    private async _calculateMarketBuyQuoteInfoAsync(
        prunedOrders: SignedOrderWithFillableAmounts[],
        makerAssetBuyAmount: BigNumber,
        gasPrice: BigNumber,
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
                const adjustedFillableMakerAssetAmount = fillableAmountsUtils.getMakerAssetAmountSwappedAfterFees(
                    order,
                );
                const adjustedFillableTakerAssetAmount = fillableAmountsUtils.getTakerAssetAmountSwappedAfterFees(
                    order,
                );
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
        const protocolFeeInWeiAmount = await this._protocolFeeUtils.calculateWorstCaseProtocolFeeAsync(prunedOrders, gasPrice);
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
