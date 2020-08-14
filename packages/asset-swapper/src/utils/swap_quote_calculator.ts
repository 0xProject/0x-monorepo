import { assetDataUtils } from '@0x/order-utils';
import { AssetProxyId, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalculateSwapQuoteOpts,
    MarketBuySwapQuote,
    MarketOperation,
    MarketSellSwapQuote,
    SwapQuote,
    SwapQuoteInfo,
    SwapQuoteOrdersBreakdown,
    SwapQuoterError,
} from '../types';

import { MarketOperationUtils } from './market_operation_utils';
import { getMultiHopFee } from './market_operation_utils/multihop_utils';
import { convertNativeOrderToFullyFillableOptimizedOrders } from './market_operation_utils/orders';
import {
    ERC20BridgeSource,
    FeeSchedule,
    FillData,
    GetMarketOrdersOpts,
    OptimizedMarketOrder,
} from './market_operation_utils/types';
import { isSupportedAssetDataInOrders } from './utils';

import { QuoteReport } from './quote_report_generator';
import { QuoteFillResult, simulateBestCaseFill, simulateWorstCaseFill } from './quote_simulation';

// TODO(dave4506) How do we want to reintroduce InsufficientAssetLiquidityError?
export class SwapQuoteCalculator {
    private readonly _marketOperationUtils: MarketOperationUtils;

    constructor(marketOperationUtils: MarketOperationUtils) {
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
                    return createSwapQuote(
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

        let optimizedOrders: OptimizedMarketOrder[];
        let quoteReport: QuoteReport | undefined;
        let isTwoHop = false;

        {
            // Scale fees by gas price.
            const _opts: GetMarketOrdersOpts = {
                ...opts,
                feeSchedule: _.mapValues(opts.feeSchedule, gasCost => (fillData?: FillData) =>
                    gasCost === undefined ? 0 : gasPrice.times(gasCost(fillData)),
                ),
            };

            const firstOrderMakerAssetData = !!prunedOrders[0]
                ? assetDataUtils.decodeAssetDataOrThrow(prunedOrders[0].makerAssetData)
                : { assetProxyId: '' };

            if (firstOrderMakerAssetData.assetProxyId === AssetProxyId.ERC721) {
                // HACK: to conform ERC721 orders to the output of market operation utils, assumes complete fillable
                optimizedOrders = prunedOrders.map(o => convertNativeOrderToFullyFillableOptimizedOrders(o));
            } else {
                if (operation === MarketOperation.Buy) {
                    const buyResult = await this._marketOperationUtils.getMarketBuyOrdersAsync(
                        prunedOrders,
                        assetFillAmount,
                        _opts,
                    );
                    optimizedOrders = buyResult.optimizedOrders;
                    quoteReport = buyResult.quoteReport;
                    isTwoHop = buyResult.isTwoHop;
                } else {
                    const sellResult = await this._marketOperationUtils.getMarketSellOrdersAsync(
                        prunedOrders,
                        assetFillAmount,
                        _opts,
                    );
                    optimizedOrders = sellResult.optimizedOrders;
                    quoteReport = sellResult.quoteReport;
                    isTwoHop = sellResult.isTwoHop;
                }
            }
        }

        // assetData information for the result
        const { makerAssetData, takerAssetData } = prunedOrders[0];
        return isTwoHop
            ? createTwoHopSwapQuote(
                  makerAssetData,
                  takerAssetData,
                  optimizedOrders,
                  operation,
                  assetFillAmount,
                  gasPrice,
                  opts.gasSchedule,
                  quoteReport,
              )
            : createSwapQuote(
                  makerAssetData,
                  takerAssetData,
                  optimizedOrders,
                  operation,
                  assetFillAmount,
                  gasPrice,
                  opts.gasSchedule,
                  quoteReport,
              );
    }
}

function createSwapQuote(
    makerAssetData: string,
    takerAssetData: string,
    optimizedOrders: OptimizedMarketOrder[],
    operation: MarketOperation,
    assetFillAmount: BigNumber,
    gasPrice: BigNumber,
    gasSchedule: FeeSchedule,
    quoteReport?: QuoteReport,
): SwapQuote {
    const bestCaseFillResult = simulateBestCaseFill({
        gasPrice,
        orders: optimizedOrders,
        side: operation,
        fillAmount: assetFillAmount,
        opts: { gasSchedule },
    });

    const worstCaseFillResult = simulateWorstCaseFill({
        gasPrice,
        orders: optimizedOrders,
        side: operation,
        fillAmount: assetFillAmount,
        opts: { gasSchedule },
    });

    const quoteBase = {
        takerAssetData,
        makerAssetData,
        gasPrice,
        bestCaseQuoteInfo: fillResultsToQuoteInfo(bestCaseFillResult),
        worstCaseQuoteInfo: fillResultsToQuoteInfo(worstCaseFillResult),
        sourceBreakdown: getSwapQuoteOrdersBreakdown(bestCaseFillResult.fillAmountBySource),
        orders: optimizedOrders,
        quoteReport,
        isTwoHop: false,
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

function createTwoHopSwapQuote(
    makerAssetData: string,
    takerAssetData: string,
    optimizedOrders: OptimizedMarketOrder[],
    operation: MarketOperation,
    assetFillAmount: BigNumber,
    gasPrice: BigNumber,
    gasSchedule: FeeSchedule,
    quoteReport?: QuoteReport,
): SwapQuote {
    const [firstHopOrder, secondHopOrder] = optimizedOrders;
    const [firstHopFill] = firstHopOrder.fills;
    const [secondHopFill] = secondHopOrder.fills;
    const gas = getMultiHopFee([firstHopFill, secondHopFill], gasSchedule);

    const quoteBase = {
        takerAssetData,
        makerAssetData,
        gasPrice,
        bestCaseQuoteInfo: {
            makerAssetAmount: secondHopFill.output,
            takerAssetAmount: firstHopFill.input,
            totalTakerAssetAmount: firstHopFill.input,
            feeTakerAssetAmount: constants.ZERO_AMOUNT,
            protocolFeeInWeiAmount: constants.ZERO_AMOUNT,
            gas,
        },
        worstCaseQuoteInfo: {
            makerAssetAmount: secondHopOrder.makerAssetAmount,
            takerAssetAmount: firstHopOrder.takerAssetAmount,
            totalTakerAssetAmount: firstHopOrder.takerAssetAmount,
            feeTakerAssetAmount: constants.ZERO_AMOUNT,
            protocolFeeInWeiAmount: constants.ZERO_AMOUNT,
            gas,
        },
        sourceBreakdown: {
            [ERC20BridgeSource.MultiHop]: {
                proportion: new BigNumber(1),
                hops: [firstHopFill.source, secondHopFill.source],
            },
        },
        orders: optimizedOrders,
        quoteReport,
        isTwoHop: true,
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

function getSwapQuoteOrdersBreakdown(fillAmountBySource: { [source: string]: BigNumber }): SwapQuoteOrdersBreakdown {
    const totalFillAmount = BigNumber.sum(...Object.values(fillAmountBySource));
    const breakdown: SwapQuoteOrdersBreakdown = {};
    Object.entries(fillAmountBySource).forEach(([source, fillAmount]) => {
        breakdown[source as keyof SwapQuoteOrdersBreakdown] = fillAmount.div(totalFillAmount);
    });
    return breakdown;
}

function fillResultsToQuoteInfo(fr: QuoteFillResult): SwapQuoteInfo {
    return {
        makerAssetAmount: fr.totalMakerAssetAmount,
        takerAssetAmount: fr.takerAssetAmount,
        totalTakerAssetAmount: fr.totalTakerAssetAmount,
        feeTakerAssetAmount: fr.takerFeeTakerAssetAmount,
        protocolFeeInWeiAmount: fr.protocolFeeAmount,
        gas: fr.gas,
    };
}
