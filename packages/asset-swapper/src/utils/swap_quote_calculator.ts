import { assetDataUtils, orderCalculationUtils } from '@0x/order-utils';
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
    SwapQuoteBase,
    SwapQuoteInfo,
    SwapQuoteOrdersBreakdown,
    SwapQuoterError,
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
        // checks if maker asset is ERC721 or ERC20 and taker asset is ERC20
        if (!isSupportedAssetDataInOrders(prunedOrders)) {
            throw Error(SwapQuoterError.AssetDataUnsupported);
        }
        // since prunedOrders do not have fillState, we will add a buffer of fillable orders to consider that some native are orders are partially filled

        const slippageBufferAmount = assetFillAmount.multipliedBy(slippagePercentage).integerValue();
        let resultOrders: OptimizedMarketOrder[] = [];

        {
            // Scale fees by gas price.
            const _opts = {
                ...opts,
                fees: _.mapValues(opts.fees, (v, k) => v.times(gasPrice)),
            };

            const firstOrderMakerAssetData = !!prunedOrders[0] ? assetDataUtils.decodeAssetDataOrThrow(prunedOrders[0].makerAssetData) : { assetProxyId: ''};

            if (firstOrderMakerAssetData.assetProxyId === constants.PROXY_IDS.ERC721_PROXY_ID ) {
                resultOrders = prunedOrders.map(o => {
                    // HACK: to conform ERC721 orders to the output of market operation utils, assumes complete fillable
                    return {
                        ...o,
                        fillableMakerAssetAmount: o.makerAssetAmount,
                        fillableTakerAssetAmount: o.takerAssetAmount,
                        fillableTakerFeeAmount: o.takerFee,
                        fill: {
                            source: ERC20BridgeSource.Native,
                            totalMakerAssetAmount: o.makerAssetAmount,
                            totalTakerAssetAmount: o.takerAssetAmount,
                            subFills: [],
                        },
                    };
                });
            } else {
                if (operation === MarketOperation.Buy) {
                    resultOrders = await this._marketOperationUtils.getMarketBuyOrdersAsync(
                        prunedOrders,
                        assetFillAmount.plus(slippageBufferAmount),
                        _opts,
                    );
                } else {
                    resultOrders = await this._marketOperationUtils.getMarketSellOrdersAsync(
                        prunedOrders,
                        assetFillAmount.plus(slippageBufferAmount),
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
        );
    }
    private async _createSwapQuoteAsync(
        makerAssetData: string,
        takerAssetData: string,
        resultOrders: OptimizedMarketOrder[],
        operation: MarketOperation,
        assetFillAmount: BigNumber,
        gasPrice: BigNumber,
    ): Promise<SwapQuote> {
        const bestCaseQuoteInfo = await this._calculateQuoteInfoAsync(
            resultOrders,
            assetFillAmount,
            gasPrice,
            operation,
        );
        const worstCaseQuoteInfo = await this._calculateQuoteInfoAsync(
            resultOrders,
            assetFillAmount,
            gasPrice,
            operation,
            true,
        );

        const breakdown = this._getSwapQuoteOrdersBreakdown(resultOrders, operation);

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
        operation: MarketOperation,
        worstCase: boolean = false,
    ): Promise<SwapQuoteInfo> {
        if (operation === MarketOperation.Buy) {
            return this._calculateMarketBuyQuoteInfoAsync(orders, assetFillAmount, gasPrice, worstCase);
        } else {
            return this._calculateMarketSellQuoteInfoAsync(orders, assetFillAmount, gasPrice, worstCase);
        }
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
        };
    }

    // tslint:disable-next-line: prefer-function-over-method
    private _getSwapQuoteOrdersBreakdown(
        orders: OptimizedMarketOrder[],
        operation: MarketOperation,
    ): SwapQuoteOrdersBreakdown {
        // HACK: to shut up linter
        const breakdown: SwapQuoteOrdersBreakdown = {};

        // total asset amount (accounting for slippage protection)
        const totalAssetAmount = BigNumber.sum(
            ...[
                constants.ZERO_AMOUNT,
                ...orders.map(o => (operation === MarketOperation.Buy ? o.makerAssetAmount : o.takerAssetAmount)),
            ],
        );

        return orders.reduce((acc: SwapQuoteOrdersBreakdown, order: OptimizedMarketOrder): SwapQuoteOrdersBreakdown => {
            const assetAmount = operation === MarketOperation.Buy ? order.makerAssetAmount : order.takerAssetAmount;
            const { source } = order.fill;
            return {
                ...acc,
                ...{
                    [source]: !!acc[source]
                        ? acc[source].plus(assetAmount.dividedBy(totalAssetAmount))
                        : assetAmount.dividedBy(totalAssetAmount),
                },
            };
        }, breakdown);
    }
}

function isSupportedAssetDataInOrders(
    orders: SignedOrder[],
): boolean {
    const firstOrderMakerAssetData = !!orders[0] ? assetDataUtils.decodeAssetDataOrThrow(orders[0].makerAssetData) : { assetProxyId: '' };
    return orders.every(o => {
        const takerAssetData = assetDataUtils.decodeAssetDataOrThrow(o.takerAssetData);
        const makerAssetData = assetDataUtils.decodeAssetDataOrThrow(o.makerAssetData);
        return (
            (makerAssetData.assetProxyId === constants.PROXY_IDS.ERC20_PROXY_ID
                || makerAssetData.assetProxyId === constants.PROXY_IDS.ERC721_PROXY_ID)
            ) &&
            (
                takerAssetData.assetProxyId === constants.PROXY_IDS.ERC20_PROXY_ID
            ) &&
            firstOrderMakerAssetData.assetProxyId === makerAssetData.assetProxyId; // checks that all native order maker assets are of the same type
    });
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
