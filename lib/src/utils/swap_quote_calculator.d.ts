import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { CalculateSwapQuoteOpts, MarketBuySwapQuote, MarketSellSwapQuote } from '../types';
import { MarketOperationUtils } from './market_operation_utils';
import { ProtocolFeeUtils } from './protocol_fee_utils';
export declare class SwapQuoteCalculator {
    private readonly _protocolFeeUtils;
    private readonly _marketOperationUtils;
    constructor(protocolFeeUtils: ProtocolFeeUtils, marketOperationUtils: MarketOperationUtils);
    calculateMarketSellSwapQuoteAsync(prunedOrders: SignedOrder[], takerAssetFillAmount: BigNumber, slippagePercentage: number, gasPrice: BigNumber, opts: CalculateSwapQuoteOpts): Promise<MarketSellSwapQuote>;
    calculateMarketBuySwapQuoteAsync(prunedOrders: SignedOrder[], takerAssetFillAmount: BigNumber, slippagePercentage: number, gasPrice: BigNumber, opts: CalculateSwapQuoteOpts): Promise<MarketBuySwapQuote>;
    calculateBatchMarketBuySwapQuoteAsync(batchPrunedOrders: SignedOrder[][], takerAssetFillAmounts: BigNumber[], slippagePercentage: number, gasPrice: BigNumber, opts: CalculateSwapQuoteOpts): Promise<Array<MarketBuySwapQuote | undefined>>;
    private _calculateBatchBuySwapQuoteAsync;
    private _calculateSwapQuoteAsync;
    private _createSwapQuoteAsync;
    private _calculateQuoteInfoAsync;
    private _calculateMarketSellQuoteInfoAsync;
    private _calculateMarketBuyQuoteInfoAsync;
    private _getSwapQuoteOrdersBreakdown;
}
//# sourceMappingURL=swap_quote_calculator.d.ts.map