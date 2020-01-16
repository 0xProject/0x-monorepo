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
import { ERC20BridgeSource, OptimizedMarketOrder } from './market_operation_utils/types';
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

    public async calculateBatchMarketBuySwapQuoteAsync(
        batchPrunedOrders: SignedOrder[][],
        takerAssetFillAmounts: BigNumber[],
        slippagePercentage: number,
        gasPrice: BigNumber,
        opts: CalculateSwapQuoteOpts,
    ): Promise<Array<MarketBuySwapQuote | undefined>> {
        return (await this._calculateBatchBuySwapQuoteAsync(
            batchPrunedOrders,
            takerAssetFillAmounts,
            slippagePercentage,
            gasPrice,
            MarketOperation.Buy,
            opts,
        )) as Array<MarketBuySwapQuote | undefined>;
    }
    private async _calculateBatchBuySwapQuoteAsync(
        batchPrunedOrders: SignedOrder[][],
        assetFillAmounts: BigNumber[],
        slippagePercentage: number,
        gasPrice: BigNumber,
        operation: MarketOperation,
        opts: CalculateSwapQuoteOpts,
    ): Promise<Array<SwapQuote | undefined>> {
        const assetFillAmountsWithSlippage = assetFillAmounts.map(a =>
            a.plus(a.multipliedBy(slippagePercentage).integerValue()),
        );
        const batchSignedOrders = await this._marketOperationUtils.getBatchMarketBuyOrdersAsync(
            batchPrunedOrders,
            assetFillAmountsWithSlippage,
            opts,
        );
        const batchSwapQuotes = await Promise.all(
            batchSignedOrders.map(async (orders, i) => {
                if (orders) {
                    const { makerAssetData, takerAssetData } = batchPrunedOrders[i][0];
                    return this._createSwapQuoteAsync(
                        makerAssetData,
                        takerAssetData,
                        orders,
                        operation,
                        assetFillAmounts[i],
                        gasPrice,
                        opts,
                    );
                } else {
                    return undefined;
                }
            }),
        );
        return batchSwapQuotes;
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
        let resultOrders: OptimizedMarketOrder[] = [];

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
        const { makerAssetData, takerAssetData } = prunedOrders[0];
        return this._createSwapQuoteAsync(
            makerAssetData,
            takerAssetData,
            resultOrders,
            operation,
            assetFillAmount,
            gasPrice,
            opts,
        );
    }
    private async _createSwapQuoteAsync(
        makerAssetData: string,
        takerAssetData: string,
        resultOrders: OptimizedMarketOrder[],
        operation: MarketOperation,
        assetFillAmount: BigNumber,
        gasPrice: BigNumber,
        opts: CalculateSwapQuoteOpts,
    ): Promise<SwapQuote> {
        const bestCaseQuoteInfo = await this._calculateQuoteInfoAsync(
            createBestCaseOrders(resultOrders, operation, opts.bridgeSlippage),
            assetFillAmount,
            gasPrice,
            operation,
        );
        // in order to calculate the maxRate, reverse the ordersAndFillableAmounts
        // such that they are sorted from worst rate to best rate
        const worstCaseQuoteInfo = await this._calculateQuoteInfoAsync(
            _.reverse(resultOrders.slice()),
            assetFillAmount,
            gasPrice,
            operation,
        );

        const quoteBase = {
            takerAssetData,
            makerAssetData,
            orders: resultOrders.map(o => _.omit(o, 'fill')) as SignedOrderWithFillableAmounts[],
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
        orders: OptimizedMarketOrder[],
        assetFillAmount: BigNumber,
        gasPrice: BigNumber,
        operation: MarketOperation,
    ): Promise<SwapQuoteInfo> {
        if (operation === MarketOperation.Buy) {
            return this._calculateMarketBuyQuoteInfoAsync(orders, assetFillAmount, gasPrice);
        } else {
            return this._calculateMarketSellQuoteInfoAsync(orders, assetFillAmount, gasPrice);
        }
    }

    private async _calculateMarketSellQuoteInfoAsync(
        orders: OptimizedMarketOrder[],
        takerAssetSellAmount: BigNumber,
        gasPrice: BigNumber,
    ): Promise<SwapQuoteInfo> {
        let totalMakerAssetAmount = constants.ZERO_AMOUNT;
        let totalTakerAssetAmount = constants.ZERO_AMOUNT;
        let totalFeeTakerAssetAmount = constants.ZERO_AMOUNT;
        let remainingTakerAssetFillAmount = takerAssetSellAmount;
        const filledOrders = [] as OptimizedMarketOrder[];
        for (const order of orders) {
            let makerAssetAmount = constants.ZERO_AMOUNT;
            let takerAssetAmount = constants.ZERO_AMOUNT;
            let feeTakerAssetAmount = constants.ZERO_AMOUNT;
            if (remainingTakerAssetFillAmount.lte(0)) {
                break;
            }
            const adjustedFillableMakerAssetAmount = fillableAmountsUtils.getMakerAssetAmountSwappedAfterFees(order);
            const adjustedFillableTakerAssetAmount = fillableAmountsUtils.getTakerAssetAmountSwappedAfterFees(order);
            if (
                remainingTakerAssetFillAmount.gt(adjustedFillableTakerAssetAmount) ||
                order.fill.source === ERC20BridgeSource.Native
            ) {
                const takerAssetAmountWithFees = BigNumber.min(
                    remainingTakerAssetFillAmount,
                    adjustedFillableTakerAssetAmount,
                );
                const takerAssetAmountBreakDown = getTakerAssetAmountBreakDown(order, takerAssetAmountWithFees);
                takerAssetAmount = takerAssetAmountBreakDown.takerAssetAmount;
                feeTakerAssetAmount = takerAssetAmountBreakDown.feeTakerAssetAmount;
                makerAssetAmount = takerAssetAmountWithFees
                    .div(adjustedFillableTakerAssetAmount)
                    .times(adjustedFillableMakerAssetAmount)
                    .integerValue(BigNumber.ROUND_DOWN);
            } else {
                // This is the last order filled AND a collapsed bridge order.
                // Because collapsed bridge orders actually fill at different rates,
                // we can iterate over the uncollapsed fills to get the actual
                // asset amounts transfered.
                // We can also assume there are no fees and the order is not
                // partially filled.
                for (const subFill of order.fill.subFills) {
                    if (remainingTakerAssetFillAmount.minus(takerAssetAmount).lte(0)) {
                        break;
                    }
                    const partialTakerAssetAmount = BigNumber.min(
                        subFill.takerAssetAmount,
                        remainingTakerAssetFillAmount.minus(takerAssetAmount),
                    );
                    const partialMakerAssetAmount = partialTakerAssetAmount
                        .div(subFill.takerAssetAmount)
                        .times(subFill.makerAssetAmount)
                        .integerValue(BigNumber.ROUND_DOWN);
                    takerAssetAmount = takerAssetAmount.plus(partialTakerAssetAmount);
                    makerAssetAmount = makerAssetAmount.plus(partialMakerAssetAmount);
                }
            }
            totalMakerAssetAmount = totalMakerAssetAmount.plus(makerAssetAmount);
            totalTakerAssetAmount = totalTakerAssetAmount.plus(takerAssetAmount);
            totalFeeTakerAssetAmount = totalFeeTakerAssetAmount.plus(feeTakerAssetAmount);
            remainingTakerAssetFillAmount = remainingTakerAssetFillAmount
                .minus(takerAssetAmount)
                .minus(feeTakerAssetAmount);
            filledOrders.push(order);
        }
        const protocolFeeInWeiAmount = await this._protocolFeeUtils.calculateWorstCaseProtocolFeeAsync(
            filledOrders,
            gasPrice,
        );
        return {
            feeTakerAssetAmount: totalFeeTakerAssetAmount,
            takerAssetAmount: totalTakerAssetAmount,
            totalTakerAssetAmount: totalFeeTakerAssetAmount.plus(totalTakerAssetAmount),
            makerAssetAmount: totalMakerAssetAmount,
            protocolFeeInWeiAmount,
        };
    }

    private async _calculateMarketBuyQuoteInfoAsync(
        orders: OptimizedMarketOrder[],
        makerAssetBuyAmount: BigNumber,
        gasPrice: BigNumber,
    ): Promise<SwapQuoteInfo> {
        const result = orders.reduce(
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
                    .integerValue(BigNumber.ROUND_UP);

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
        const protocolFeeInWeiAmount = await this._protocolFeeUtils.calculateWorstCaseProtocolFeeAsync(
            orders,
            gasPrice,
        );
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
            .integerValue(BigNumber.ROUND_UP);
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

function createBestCaseOrders(
    orders: OptimizedMarketOrder[],
    operation: MarketOperation,
    bridgeSlippage: number,
): OptimizedMarketOrder[] {
    // Scale the asset amounts to undo the bridge slippage applied to
    // bridge orders.
    const bestCaseOrders: OptimizedMarketOrder[] = [];
    for (const order of orders) {
        if (order.fill.source === ERC20BridgeSource.Native) {
            bestCaseOrders.push(order);
            continue;
        }
        bestCaseOrders.push({
            ...order,
            ...(operation === MarketOperation.Sell
                ? {
                      makerAssetAmount: order.makerAssetAmount
                          .dividedBy(1 - bridgeSlippage)
                          .integerValue(BigNumber.ROUND_DOWN),
                  }
                : // Buy operation
                  {
                      takerAssetAmount: order.takerAssetAmount
                          .dividedBy(bridgeSlippage + 1)
                          .integerValue(BigNumber.ROUND_UP),
                  }),
        });
    }
    return bestCaseOrders;
}
