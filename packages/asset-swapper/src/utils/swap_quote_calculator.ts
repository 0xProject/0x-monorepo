import { assetDataUtils, orderCalculationUtils } from '@0x/order-utils';
import { AssetProxyId, SignedOrder } from '@0x/types';
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
    SwapQuoteBase,
    SwapQuoteInfo,
    SwapQuoteOrdersBreakdown,
    SwapQuoterError,
} from '../types';

import { fillableAmountsUtils } from './fillable_amounts_utils';
import { MarketOperationUtils } from './market_operation_utils';
import { convertNativeOrderToFullyFillableOptimizedOrders } from './market_operation_utils/orders';
import { ERC20BridgeSource, OptimizedMarketOrder } from './market_operation_utils/types';
import { ProtocolFeeUtils } from './protocol_fee_utils';
import {
    isOrderTakerFeePayableWithMakerAsset,
    isOrderTakerFeePayableWithTakerAsset,
    isSupportedAssetDataInOrders,
} from './utils';

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
        gasPrice: BigNumber,
        opts: CalculateSwapQuoteOpts,
    ): Promise<MarketSellSwapQuote> {
        return (await this._calculateSwapQuoteAsync(
            prunedOrders,
            takerAssetFillAmount,
            gasPrice,
            MarketOperation.Sell,
            opts,
        )) as MarketSellSwapQuote;
    }

    public async calculateMarketBuySwapQuoteAsync(
        prunedOrders: SignedOrder[],
        takerAssetFillAmount: BigNumber,
        gasPrice: BigNumber,
        opts: CalculateSwapQuoteOpts,
    ): Promise<MarketBuySwapQuote> {
        return (await this._calculateSwapQuoteAsync(
            prunedOrders,
            takerAssetFillAmount,
            gasPrice,
            MarketOperation.Buy,
            opts,
        )) as MarketBuySwapQuote;
    }

    public async calculateBatchMarketBuySwapQuoteAsync(
        batchPrunedOrders: SignedOrder[][],
        takerAssetFillAmounts: BigNumber[],
        gasPrice: BigNumber,
        opts: CalculateSwapQuoteOpts,
    ): Promise<Array<MarketBuySwapQuote | undefined>> {
        return (await this._calculateBatchBuySwapQuoteAsync(
            batchPrunedOrders,
            takerAssetFillAmounts,
            gasPrice,
            MarketOperation.Buy,
            opts,
        )) as Array<MarketBuySwapQuote | undefined>;
    }

    private async _calculateBatchBuySwapQuoteAsync(
        batchPrunedOrders: SignedOrder[][],
        assetFillAmounts: BigNumber[],
        gasPrice: BigNumber,
        operation: MarketOperation,
        opts: CalculateSwapQuoteOpts,
    ): Promise<Array<SwapQuote | undefined>> {
        const batchSignedOrders = await this._marketOperationUtils.getBatchMarketBuyOrdersAsync(
            batchPrunedOrders,
            assetFillAmounts,
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
                        opts.gasSchedule,
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
        gasPrice: BigNumber,
        operation: MarketOperation,
        opts: CalculateSwapQuoteOpts,
    ): Promise<SwapQuote> {
        // checks if maker asset is ERC721 or ERC20 and taker asset is ERC20
        if (!isSupportedAssetDataInOrders(prunedOrders)) {
            throw Error(SwapQuoterError.AssetDataUnsupported);
        }
        // since prunedOrders do not have fillState, we will add a buffer of fillable orders to consider that some native are orders are partially filled

        let resultOrders: OptimizedMarketOrder[] = [];

        {
            // Scale fees by gas price.
            const _opts = {
                ...opts,
                fees: _.mapValues(opts.feeSchedule, v => v.times(gasPrice)),
            };

            const firstOrderMakerAssetData = !!prunedOrders[0]
                ? assetDataUtils.decodeAssetDataOrThrow(prunedOrders[0].makerAssetData)
                : { assetProxyId: '' };

            if (firstOrderMakerAssetData.assetProxyId === AssetProxyId.ERC721) {
                // HACK: to conform ERC721 orders to the output of market operation utils, assumes complete fillable
                resultOrders = prunedOrders.map(o => convertNativeOrderToFullyFillableOptimizedOrders(o));
            } else {
                if (operation === MarketOperation.Buy) {
                    resultOrders = await this._marketOperationUtils.getMarketBuyOrdersAsync(
                        prunedOrders,
                        assetFillAmount,
                        _opts,
                    );
                } else {
                    resultOrders = await this._marketOperationUtils.getMarketSellOrdersAsync(
                        prunedOrders,
                        assetFillAmount,
                        _opts,
                    );
                }
            }
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
            opts.gasSchedule,
        );
    }
    private async _createSwapQuoteAsync(
        makerAssetData: string,
        takerAssetData: string,
        resultOrders: OptimizedMarketOrder[],
        operation: MarketOperation,
        assetFillAmount: BigNumber,
        gasPrice: BigNumber,
        gasSchedule: { [source: string]: number },
    ): Promise<SwapQuote> {
        const bestCaseQuoteInfo = await this._calculateQuoteInfoAsync(
            resultOrders,
            assetFillAmount,
            gasPrice,
            gasSchedule,
            operation,
        );
        const worstCaseQuoteInfo = await this._calculateQuoteInfoAsync(
            resultOrders,
            assetFillAmount,
            gasPrice,
            gasSchedule,
            operation,
            true,
        );

        const breakdown = getSwapQuoteOrdersBreakdown(resultOrders, operation);

        const quoteBase: SwapQuoteBase = {
            takerAssetData,
            makerAssetData,
            // Remove fill metadata.
            orders: resultOrders.map(o => _.omit(o, 'fill')) as SignedOrderWithFillableAmounts[],
            bestCaseQuoteInfo,
            worstCaseQuoteInfo,
            gasPrice,
            sourceBreakdown: breakdown,
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
        gasSchedule: { [source: string]: number },
        operation: MarketOperation,
        worstCase: boolean = false,
    ): Promise<SwapQuoteInfo> {
        return {
            ...(operation === MarketOperation.Buy
                ? await this._calculateMarketBuyQuoteInfoAsync(orders, assetFillAmount, gasPrice, worstCase)
                : await this._calculateMarketSellQuoteInfoAsync(orders, assetFillAmount, gasPrice, worstCase)),
            gas: getGasUsedByOrders(orders, gasSchedule),
        };
    }

    private async _calculateMarketSellQuoteInfoAsync(
        orders: OptimizedMarketOrder[],
        takerAssetSellAmount: BigNumber,
        gasPrice: BigNumber,
        worstCase: boolean = false,
    ): Promise<SwapQuoteInfo> {
        let totalMakerAssetAmount = constants.ZERO_AMOUNT;
        let totalTakerAssetAmount = constants.ZERO_AMOUNT;
        let totalFeeTakerAssetAmount = constants.ZERO_AMOUNT;
        let remainingTakerAssetFillAmount = takerAssetSellAmount;
        const filledOrders = [] as OptimizedMarketOrder[];
        const _orders = !worstCase ? orders : orders.slice().reverse();
        for (const order of _orders) {
            let makerAssetAmount = constants.ZERO_AMOUNT;
            let takerAssetAmount = constants.ZERO_AMOUNT;
            let feeTakerAssetAmount = constants.ZERO_AMOUNT;
            if (remainingTakerAssetFillAmount.lte(0)) {
                break;
            }
            if (order.fill.source === ERC20BridgeSource.Native) {
                const adjustedFillableMakerAssetAmount = fillableAmountsUtils.getMakerAssetAmountSwappedAfterOrderFees(
                    order,
                );
                const adjustedFillableTakerAssetAmount = fillableAmountsUtils.getTakerAssetAmountSwappedAfterOrderFees(
                    order,
                );
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
                // This is a collapsed bridge order.
                // Because collapsed bridge orders actually fill at different rates,
                // we can iterate over the uncollapsed fills to get the actual
                // asset amounts transfered.
                // We can also assume there are no fees and the order is not
                // partially filled.

                // Infer the bridge slippage from the difference between the fill
                // size and the actual order asset amounts.
                const makerAssetBridgeSlippage = !worstCase
                    ? constants.ONE_AMOUNT
                    : order.makerAssetAmount.div(order.fill.totalMakerAssetAmount);
                const takerAssetBridgeSlippage = !worstCase
                    ? constants.ONE_AMOUNT
                    : order.takerAssetAmount.div(order.fill.totalTakerAssetAmount);
                // Consecutively fill the subfills in this order.
                const subFills = !worstCase ? order.fill.subFills : order.fill.subFills.slice().reverse();
                for (const subFill of subFills) {
                    if (remainingTakerAssetFillAmount.minus(takerAssetAmount).lte(0)) {
                        break;
                    }
                    const partialTakerAssetAmount = subFill.takerAssetAmount.times(takerAssetBridgeSlippage);
                    const partialMakerAssetAmount = subFill.makerAssetAmount.times(makerAssetBridgeSlippage);
                    const partialTakerAssetFillAmount = BigNumber.min(
                        partialTakerAssetAmount,
                        remainingTakerAssetFillAmount.minus(takerAssetAmount),
                    );
                    const partialMakerAssetFillAmount = partialTakerAssetFillAmount
                        .div(partialTakerAssetAmount)
                        .times(partialMakerAssetAmount)
                        .integerValue(BigNumber.ROUND_DOWN);
                    takerAssetAmount = takerAssetAmount.plus(partialTakerAssetFillAmount);
                    makerAssetAmount = makerAssetAmount.plus(partialMakerAssetFillAmount);
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
            !worstCase ? filledOrders : orders,
            gasPrice,
        );
        return {
            feeTakerAssetAmount: totalFeeTakerAssetAmount,
            takerAssetAmount: totalTakerAssetAmount,
            totalTakerAssetAmount: totalFeeTakerAssetAmount.plus(totalTakerAssetAmount),
            makerAssetAmount: totalMakerAssetAmount,
            protocolFeeInWeiAmount,
            gas: 0,
        };
    }

    private async _calculateMarketBuyQuoteInfoAsync(
        orders: OptimizedMarketOrder[],
        makerAssetBuyAmount: BigNumber,
        gasPrice: BigNumber,
        worstCase: boolean = false,
    ): Promise<SwapQuoteInfo> {
        let totalMakerAssetAmount = constants.ZERO_AMOUNT;
        let totalTakerAssetAmount = constants.ZERO_AMOUNT;
        let totalFeeTakerAssetAmount = constants.ZERO_AMOUNT;
        let remainingMakerAssetFillAmount = makerAssetBuyAmount;
        const filledOrders = [] as OptimizedMarketOrder[];
        const _orders = !worstCase ? orders : orders.slice().reverse();
        for (const order of _orders) {
            let makerAssetAmount = constants.ZERO_AMOUNT;
            let takerAssetAmount = constants.ZERO_AMOUNT;
            let feeTakerAssetAmount = constants.ZERO_AMOUNT;
            if (remainingMakerAssetFillAmount.lte(0)) {
                break;
            }
            if (order.fill.source === ERC20BridgeSource.Native) {
                const adjustedFillableMakerAssetAmount = fillableAmountsUtils.getMakerAssetAmountSwappedAfterOrderFees(
                    order,
                );
                const adjustedFillableTakerAssetAmount = fillableAmountsUtils.getTakerAssetAmountSwappedAfterOrderFees(
                    order,
                );
                makerAssetAmount = BigNumber.min(remainingMakerAssetFillAmount, adjustedFillableMakerAssetAmount);
                const takerAssetAmountWithFees = makerAssetAmount
                    .div(adjustedFillableMakerAssetAmount)
                    .multipliedBy(adjustedFillableTakerAssetAmount)
                    .integerValue(BigNumber.ROUND_UP);
                const takerAssetAmountBreakDown = getTakerAssetAmountBreakDown(order, takerAssetAmountWithFees);
                takerAssetAmount = takerAssetAmountBreakDown.takerAssetAmount;
                feeTakerAssetAmount = takerAssetAmountBreakDown.feeTakerAssetAmount;
            } else {
                // This is a collapsed bridge order.
                // Because collapsed bridge orders actually fill at different rates,
                // we can iterate over the uncollapsed fills to get the actual
                // asset amounts transfered.
                // We can also assume there are no fees and the order is not
                // partially filled.

                // Infer the bridge slippage from the difference between the fill
                // size and the actual order asset amounts.
                const makerAssetBridgeSlippage = !worstCase
                    ? constants.ONE_AMOUNT
                    : order.makerAssetAmount.div(order.fill.totalMakerAssetAmount);
                const takerAssetBridgeSlippage = !worstCase
                    ? constants.ONE_AMOUNT
                    : order.takerAssetAmount.div(order.fill.totalTakerAssetAmount);
                // Consecutively fill the subfills in this order.
                const subFills = !worstCase ? order.fill.subFills : order.fill.subFills.slice().reverse();
                for (const subFill of subFills) {
                    if (remainingMakerAssetFillAmount.minus(makerAssetAmount).lte(0)) {
                        break;
                    }
                    const partialTakerAssetAmount = subFill.takerAssetAmount.times(takerAssetBridgeSlippage);
                    const partialMakerAssetAmount = subFill.makerAssetAmount.times(makerAssetBridgeSlippage);
                    const partialMakerAssetFillAmount = BigNumber.min(
                        partialMakerAssetAmount,
                        remainingMakerAssetFillAmount.minus(makerAssetAmount),
                    );
                    const partialTakerAssetFillAmount = partialMakerAssetFillAmount
                        .div(partialMakerAssetAmount)
                        .times(partialTakerAssetAmount)
                        .integerValue(BigNumber.ROUND_UP);
                    takerAssetAmount = takerAssetAmount.plus(partialTakerAssetFillAmount);
                    makerAssetAmount = makerAssetAmount.plus(partialMakerAssetFillAmount);
                }
            }
            totalMakerAssetAmount = totalMakerAssetAmount.plus(makerAssetAmount);
            totalTakerAssetAmount = totalTakerAssetAmount.plus(takerAssetAmount);
            totalFeeTakerAssetAmount = totalFeeTakerAssetAmount.plus(feeTakerAssetAmount);
            remainingMakerAssetFillAmount = remainingMakerAssetFillAmount.minus(makerAssetAmount);
            filledOrders.push(order);
        }
        const protocolFeeInWeiAmount = await this._protocolFeeUtils.calculateWorstCaseProtocolFeeAsync(
            !worstCase ? filledOrders : orders,
            gasPrice,
        );
        return {
            feeTakerAssetAmount: totalFeeTakerAssetAmount,
            takerAssetAmount: totalTakerAssetAmount,
            totalTakerAssetAmount: totalFeeTakerAssetAmount.plus(totalTakerAssetAmount),
            makerAssetAmount: totalMakerAssetAmount,
            protocolFeeInWeiAmount,
            gas: 0,
        };
    }
}

function getSwapQuoteOrdersBreakdown(
    orders: OptimizedMarketOrder[],
    operation: MarketOperation,
): SwapQuoteOrdersBreakdown {
    const orderAmounts =
        operation === MarketOperation.Buy
            ? orders.map(o => o.fill.totalMakerAssetAmount)
            : orders.map(o => o.fill.totalTakerAssetAmount);
    const amountsBySource: SwapQuoteOrdersBreakdown = {};
    orders.forEach((o, i) => {
        const source = o.fill.source;
        amountsBySource[source] = orderAmounts[i].plus(amountsBySource[source] || 0);
    });
    const totalAmount = BigNumber.sum(0, ...orderAmounts);
    const breakdown: SwapQuoteOrdersBreakdown = {};
    for (const [source, amount] of Object.entries(amountsBySource)) {
        breakdown[source] = amount.div(totalAmount);
    }
    return breakdown;
}

function getTakerAssetAmountBreakDown(
    order: SignedOrderWithFillableAmounts,
    takerAssetAmountWithFees: BigNumber,
): { feeTakerAssetAmount: BigNumber; takerAssetAmount: BigNumber } {
    if (isOrderTakerFeePayableWithTakerAsset(order)) {
        const adjustedTakerAssetAmount = order.takerAssetAmount.plus(order.takerFee);
        const filledRatio = takerAssetAmountWithFees.div(adjustedTakerAssetAmount);
        const takerAssetAmount = filledRatio.multipliedBy(order.takerAssetAmount).integerValue(BigNumber.ROUND_CEIL);
        return {
            takerAssetAmount,
            feeTakerAssetAmount: takerAssetAmountWithFees.minus(takerAssetAmount),
        };
    } else if (isOrderTakerFeePayableWithMakerAsset(order)) {
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

function getGasUsedByOrders(orders: OptimizedMarketOrder[], gasSchedule: { [source: string]: number }): number {
    let totalUsage = 0;
    for (const order of orders) {
        totalUsage += gasSchedule[order.fill.source] || 0;
    }
    return totalUsage;
}
// tslint:disable: max-file-line-count
