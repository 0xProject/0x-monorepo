import { IERC20BridgeSamplerContract } from '@0x/contract-wrappers';
import { BigNumber } from '@0x/utils';

import { RfqtRequestOpts, SignedOrderWithFillableAmounts } from '../../types';
import { QuoteRequestor, RfqtIndicativeQuoteResponse } from '../../utils/quote_requestor';

/**
 * Order domain keys: chainId and exchange
 */
export interface OrderDomain {
    chainId: number;
    exchangeAddress: string;
}

/**
 * Common exception messages thrown by aggregation logic.
 */
export enum AggregationError {
    NoOptimalPath = 'NO_OPTIMAL_PATH',
    EmptyOrders = 'EMPTY_ORDERS',
    NotERC20AssetData = 'NOT_ERC20ASSET_DATA',
    NoBridgeForSource = 'NO_BRIDGE_FOR_SOURCE',
}

/**
 * DEX sources to aggregate.
 */
export enum ERC20BridgeSource {
    Native = 'Native',
    Uniswap = 'Uniswap',
    UniswapV2 = 'Uniswap_V2',
    UniswapV2Eth = 'Uniswap_V2_ETH',
    Eth2Dai = 'Eth2Dai',
    Kyber = 'Kyber',
    CurveUsdcDai = 'Curve_USDC_DAI',
    CurveUsdcDaiUsdt = 'Curve_USDC_DAI_USDT',
    CurveUsdcDaiUsdtTusd = 'Curve_USDC_DAI_USDT_TUSD',
    CurveUsdcDaiUsdtBusd = 'Curve_USDC_DAI_USDT_BUSD',
    CurveUsdcDaiUsdtSusd = 'Curve_USDC_DAI_USDT_SUSD',
    LiquidityProvider = 'LiquidityProvider',
    MultiBridge = 'MultiBridge',
}

// Internal `fillData` field for `Fill` objects.
export interface FillData {}

// `FillData` for native fills.
export interface NativeFillData extends FillData {
    order: SignedOrderWithFillableAmounts;
}

export interface RfqtFillData extends FillData {
    quote: RfqtIndicativeQuoteResponse;
}

/**
 * Represents an individual DEX sample from the sampler contract.
 */
export interface DexSample {
    source: ERC20BridgeSource;
    input: BigNumber;
    output: BigNumber;
}

/**
 * Flags for `Fill` objects.
 */
export enum FillFlags {
    ConflictsWithKyber = 0x1,
    Kyber = 0x2,
    ConflictsWithMultiBridge = 0x4,
    MultiBridge = 0x8,
}

/**
 * Represents a node on a fill path.
 */
export interface Fill {
    // See `FillFlags`.
    flags: FillFlags;
    // Input fill amount (taker asset amount in a sell, maker asset amount in a buy).
    input: BigNumber;
    // Output fill amount (maker asset amount in a sell, taker asset amount in a buy).
    output: BigNumber;
    // The maker/taker rate.
    rate: BigNumber;
    // The maker/taker rate, adjusted by fees.
    adjustedRate: BigNumber;
    // The output fill amount, ajdusted by fees.
    adjustedOutput: BigNumber;
    // Fill that must precede this one. This enforces certain fills to be contiguous.
    parent?: Fill;
    // The index of the fill in the original path.
    index: number;
    // The source of the fill. See `ERC20BridgeSource`.
    source: ERC20BridgeSource;
    // Data associated with this this Fill object. Used to reconstruct orders
    // from paths.
    fillData?: FillData | NativeFillData;
}

/**
 * Represents continguous fills on a path that have been merged together.
 */
export interface CollapsedFill {
    /**
     * The source DEX.
     */
    source: ERC20BridgeSource;
    /**
     * Total input amount (sum of `subFill`s)
     */
    input: BigNumber;
    /**
     * Total output amount (sum of `subFill`s)
     */
    output: BigNumber;
    /**
     * Quantities of all the fills that were collapsed.
     */
    subFills: Array<{
        input: BigNumber;
        output: BigNumber;
    }>;
}

/**
 * A `CollapsedFill` wrapping a native order.
 */
export interface NativeCollapsedFill extends CollapsedFill {
    nativeOrder: SignedOrderWithFillableAmounts;
}

/**
 * Optimized orders to fill.
 */
export interface OptimizedMarketOrder extends SignedOrderWithFillableAmounts {
    /**
     * The optimized fills that generated this order.
     */
    fills: CollapsedFill[];
}

export interface GetMarketOrdersRfqtOpts extends RfqtRequestOpts {
    quoteRequestor?: QuoteRequestor;
}

/**
 * Options for `getMarketSellOrdersAsync()` and `getMarketBuyOrdersAsync()`.
 */
export interface GetMarketOrdersOpts {
    /**
     * Liquidity sources to exclude. Default is none.
     */
    excludedSources: ERC20BridgeSource[];
    /**
     * Complexity limit on the search algorithm, i.e., maximum number of
     * nodes to visit. Default is 1024.
     */
    runLimit: number;
    /**
     * When generating bridge orders, we use
     * sampled rate * (1 - bridgeSlippage)
     * as the rate for calculating maker/taker asset amounts.
     * This should be a small positive number (e.g., 0.0005) to make up for
     * small discrepancies between samples and truth.
     * Default is 0.0005 (5 basis points).
     */
    bridgeSlippage: number;
    /**
     * The maximum price slippage allowed in the fallback quote. If the slippage
     * between the optimal quote and the fallback quote is greater than this
     * percentage, no fallback quote will be provided.
     */
    maxFallbackSlippage: number;
    /**
     * Number of samples to take for each DEX quote.
     */
    numSamples: number;
    /**
     * The exponential sampling distribution base.
     * A value of 1 will result in evenly spaced samples.
     * > 1 will result in more samples at lower sizes.
     * < 1 will result in more samples at higher sizes.
     * Default: 1.25.
     */
    sampleDistributionBase: number;
    /**
     * Fees for each liquidity source, expressed in gas.
     */
    feeSchedule: { [source: string]: BigNumber };
    /**
     * Estimated gas consumed by each liquidity source.
     */
    gasSchedule: { [source: string]: number };
    /**
     * Whether to pad the quote with a redundant fallback quote using different
     * sources. Defaults to `true`.
     */
    allowFallback: boolean;
    rfqt?: GetMarketOrdersRfqtOpts;
    /**
     * Whether to combine contiguous bridge orders into a single DexForwarderBridge
     * order. Defaults to `true`.
     */
    shouldBatchBridgeOrders: boolean;
}

/**
 * A composable operation the be run in `DexOrderSampler.executeAsync()`.
 */
export interface BatchedOperation<TResult> {
    encodeCall(contract: IERC20BridgeSamplerContract): string;
    handleCallResultsAsync(contract: IERC20BridgeSamplerContract, callResults: string): Promise<TResult>;
}

/**
 * Used in the ERC20BridgeSampler when a source does not natively
 * support sampling via a specific buy amount.
 */
export interface FakeBuyOpts {
    targetSlippageBps: BigNumber;
    maxIterations: BigNumber;
}
