import { assetDataUtils } from '@0x/order-utils';
import { AssetProxyId, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import {
    CalculateSwapQuoteOpts,
    MarketBuySwapQuote,
    MarketOperation,
    MarketSellSwapQuote,
    SwapQuote,
    SwapQuoteBase,
    SwapQuoteInfo,
    SwapQuoteOrdersBreakdown,
    SwapQuoterError,
} from '../types';

import { MarketOperationUtils } from './market_operation_utils';
import { convertNativeOrderToFullyFillableOptimizedOrders } from './market_operation_utils/orders';
import { GetMarketOrdersOpts, OptimizedMarketOrder, OptimizedOrdersAndQuoteReport } from './market_operation_utils/types';
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
        const blankQuoteReport = { sourcesConsidered: [], sourcesDelivered: [] }; // TODO: better solution here
        const batchSwapQuotes = await Promise.all(
            batchSignedOrders.map(async (orders, i) => {
                if (orders) {
                    const { makerAssetData, takerAssetData } = batchPrunedOrders[i][0];
                    return createSwapQuote(
                        makerAssetData,
                        takerAssetData,
                        { optimizedOrders: orders, quoteReport: blankQuoteReport },
                        operation,
                        assetFillAmounts[i],
                        gasPrice,
                        opts.gasSchedule,
                        blankQuoteReport,
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

        let result: OptimizedOrdersAndQuoteReport | undefined;

        {
            // Scale fees by gas price.
            const _opts: GetMarketOrdersOpts = {
                ...opts,
                feeSchedule: _.mapValues(opts.feeSchedule, v => v.times(gasPrice)),
            };

            const firstOrderMakerAssetData = !!prunedOrders[0]
                ? assetDataUtils.decodeAssetDataOrThrow(prunedOrders[0].makerAssetData)
                : { assetProxyId: '' };

            if (firstOrderMakerAssetData.assetProxyId === AssetProxyId.ERC721) {
                const blankQuoteReport = { sourcesConsidered: [], sourcesDelivered: [] }; // TODO: better solution here
                // HACK: to conform ERC721 orders to the output of market operation utils, assumes complete fillable
                result = { optimizedOrders: prunedOrders.map(o => convertNativeOrderToFullyFillableOptimizedOrders(o)), quoteReport: blankQuoteReport };
            } else {
                if (operation === MarketOperation.Buy) {
                    result = await this._marketOperationUtils.getMarketBuyOrdersAsync(
                        prunedOrders,
                        assetFillAmount,
                        _opts,
                    );
                } else {
                    result = await this._marketOperationUtils.getMarketSellOrdersAsync(
                        prunedOrders,
                        assetFillAmount,
                        _opts,
                    );
                }
            }
        }

        // assetData information for the result
        const { makerAssetData, takerAssetData } = prunedOrders[0];
        return createSwapQuote(
            makerAssetData,
            takerAssetData,
            result,
            operation,
            assetFillAmount,
            gasPrice,
            opts.gasSchedule,
            result.quoteReport,
        );
    }
}

function createSwapQuote(
    makerAssetData: string,
    takerAssetData: string,
    result: OptimizedOrdersAndQuoteReport,
    operation: MarketOperation,
    assetFillAmount: BigNumber,
    gasPrice: BigNumber,
    gasSchedule: { [source: string]: number },
    quoteReport: QuoteReport,
): SwapQuote {
    const resultOrders = result.optimizedOrders;

    const bestCaseFillResult = simulateBestCaseFill({
        gasPrice,
        orders: resultOrders,
        side: operation,
        fillAmount: assetFillAmount,
        opts: { gasSchedule },
    });

    const worstCaseFillResult = simulateWorstCaseFill({
        gasPrice,
        orders: resultOrders,
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
        orders: resultOrders,
        quoteReport,
    };

    if (operation === MarketOperation.Buy) {
        return {
            ...quoteBase,
            type: MarketOperation.Buy,
            makerAssetFillAmount: assetFillAmount,
            quoteReport: result.quoteReport,
        };
    } else {
        return {
            ...quoteBase,
            type: MarketOperation.Sell,
            takerAssetFillAmount: assetFillAmount,
            quoteReport: result.quoteReport,
        };
    }
}

function getSwapQuoteOrdersBreakdown(fillAmountBySource: { [source: string]: BigNumber }): SwapQuoteOrdersBreakdown {
    const totalFillAmount = BigNumber.sum(...Object.values(fillAmountBySource));
    const breakdown: SwapQuoteOrdersBreakdown = {};
    Object.entries(fillAmountBySource).forEach(([source, fillAmount]) => {
        breakdown[source] = fillAmount.div(totalFillAmount);
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
