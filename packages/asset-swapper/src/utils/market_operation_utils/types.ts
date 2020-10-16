import { RFQTIndicativeQuote } from '@0x/quote-server';
import { MarketOperation, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { RfqtRequestOpts, SignedOrderWithFillableAmounts } from '../../types';
import { QuoteRequestor } from '../../utils/quote_requestor';
import { QuoteReport } from '../quote_report_generator';

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
    Eth2Dai = 'Eth2Dai',
    Kyber = 'Kyber',
    Curve = 'Curve',
    LiquidityProvider = 'LiquidityProvider',
    MultiBridge = 'MultiBridge',
    Balancer = 'Balancer',
    Cream = 'CREAM',
    Bancor = 'Bancor',
    MStable = 'mStable',
    Mooniswap = 'Mooniswap',
    MultiHop = 'MultiHop',
    Shell = 'Shell',
    Swerve = 'Swerve',
    SushiSwap = 'SushiSwap',
    Dodo = 'DODO',
}

// tslint:disable: enum-naming
/**
 * Curve contract function selectors.
 */
export enum CurveFunctionSelectors {
    None = '0x00000000',
    exchange = '0x3df02124',
    exchange_underlying = '0xa6417ed6',
    get_dy_underlying = '0x07211ef7',
    get_dx_underlying = '0x0e71d1b9',
    get_dy = '0x5e0d443f',
    get_dx = '0x67df02ca',
}
// tslint:enable: enum-naming

/**
 * Configuration info on a Curve pool.
 */
export interface CurveInfo {
    exchangeFunctionSelector: CurveFunctionSelectors;
    sellQuoteFunctionSelector: CurveFunctionSelectors;
    buyQuoteFunctionSelector: CurveFunctionSelectors;
    poolAddress: string;
    tokens: string[];
}

export interface SwerveInfo extends CurveInfo {}

// Internal `fillData` field for `Fill` objects.
export interface FillData {}

export interface SourceInfo<TFillData extends FillData = FillData> {
    source: ERC20BridgeSource;
    fillData?: TFillData;
}

// `FillData` for native fills.
export interface NativeFillData extends FillData {
    order: SignedOrderWithFillableAmounts;
}

export interface CurveFillData extends FillData {
    fromTokenIdx: number;
    toTokenIdx: number;
    curve: CurveInfo;
}

export interface SwerveFillData extends FillData {
    fromTokenIdx: number;
    toTokenIdx: number;
    pool: SwerveInfo;
}

export interface BalancerFillData extends FillData {
    poolAddress: string;
}

export interface UniswapV2FillData extends FillData {
    tokenAddressPath: string[];
}

export interface SushiSwapFillData extends UniswapV2FillData {
    router: string;
}

export interface LiquidityProviderFillData extends FillData {
    poolAddress: string;
}

export interface MultiBridgeFillData extends FillData {
    poolAddress: string;
}

export interface BancorFillData extends FillData {
    path: string[];
    networkAddress: string;
}

export interface KyberFillData extends FillData {
    hint: string;
    reserveId: string;
}

export interface MooniswapFillData extends FillData {
    poolAddress: string;
}

export interface DODOFillData extends FillData {
    poolAddress: string;
    isSellBase: boolean;
}

export interface Quote<TFillData = FillData> {
    amount: BigNumber;
    fillData?: TFillData;
}

export interface HopInfo {
    sourceIndex: BigNumber;
    returnData: string;
}

export interface MultiHopFillData extends FillData {
    firstHopSource: SourceQuoteOperation;
    secondHopSource: SourceQuoteOperation;
    intermediateToken: string;
}

/**
 * Represents an individual DEX sample from the sampler contract.
 */
export interface DexSample<TFillData extends FillData = FillData> extends SourceInfo<TFillData> {
    input: BigNumber;
    output: BigNumber;
}

/**
 * Represents a node on a fill path.
 */
export interface Fill<TFillData extends FillData = FillData> extends SourceInfo<TFillData> {
    // Unique ID of the original source path this fill belongs to.
    // This is generated when the path is generated and is useful to distinguish
    // paths that have the same `source` IDs but are distinct (e.g., Curves).
    sourcePathId: string;
    // See `SOURCE_FLAGS`.
    flags: number;
    // Input fill amount (taker asset amount in a sell, maker asset amount in a buy).
    input: BigNumber;
    // Output fill amount (maker asset amount in a sell, taker asset amount in a buy).
    output: BigNumber;
    // The output fill amount, ajdusted by fees.
    adjustedOutput: BigNumber;
    // Fill that must precede this one. This enforces certain fills to be contiguous.
    parent?: Fill;
    // The index of the fill in the original path.
    index: number;
}

/**
 * Represents continguous fills on a path that have been merged together.
 */
export interface CollapsedFill<TFillData extends FillData = FillData> extends SourceInfo<TFillData> {
    // Unique ID of the original source path this fill belongs to.
    // This is generated when the path is generated and is useful to distinguish
    // paths that have the same `source` IDs but are distinct (e.g., Curves).
    sourcePathId: string;
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
export interface NativeCollapsedFill extends CollapsedFill<NativeFillData> {}

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

export type FeeEstimate = (fillData?: FillData) => number | BigNumber;
export type FeeSchedule = Partial<{ [key in ERC20BridgeSource]: FeeEstimate }>;
export type ExchangeProxyOverhead = (sourceFlags: number) => BigNumber;

/**
 * Options for `getMarketSellOrdersAsync()` and `getMarketBuyOrdersAsync()`.
 */
export interface GetMarketOrdersOpts {
    /**
     * Liquidity sources to exclude. Default is none.
     */
    excludedSources: ERC20BridgeSource[];
    /**
     * Liquidity sources to exclude when used to calculate the cost of the route.
     * Default is none.
     */
    excludedFeeSources: ERC20BridgeSource[];
    /**
     * Liquidity sources to include. Default is none, which allows all supported
     * sources that aren't excluded by `excludedSources`.
     */
    includedSources: ERC20BridgeSource[];
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
    feeSchedule: FeeSchedule;
    /**
     * Estimated gas consumed by each liquidity source.
     */
    gasSchedule: FeeSchedule;
    exchangeProxyOverhead: ExchangeProxyOverhead;
    /**
     * Whether to pad the quote with a redundant fallback quote using different
     * sources. Defaults to `true`.
     */
    allowFallback: boolean;
    rfqt?: GetMarketOrdersRfqtOpts;
    /**
     * Whether to generate a quote report
     */
    shouldGenerateQuoteReport: boolean;
}

/**
 * A composable operation the be run in `DexOrderSampler.executeAsync()`.
 */
export interface BatchedOperation<TResult> {
    encodeCall(): string;
    handleCallResults(callResults: string): TResult;
}

export interface SourceQuoteOperation<TFillData extends FillData = FillData>
    extends BatchedOperation<BigNumber[]>,
        SourceInfo<TFillData> {
    readonly source: ERC20BridgeSource;
}

export interface OptimizerResult {
    optimizedOrders: OptimizedMarketOrder[];
    sourceFlags: number;
    liquidityDelivered: CollapsedFill[] | DexSample<MultiHopFillData>;
    quoteReport?: QuoteReport;
}

export type MarketDepthSide = Array<Array<DexSample<FillData>>>;

export interface MarketDepth {
    bids: MarketDepthSide;
    asks: MarketDepthSide;
}

export interface MarketSideLiquidity {
    side: MarketOperation;
    inputAmount: BigNumber;
    inputToken: string;
    outputToken: string;
    dexQuotes: Array<Array<DexSample<FillData>>>;
    nativeOrders: SignedOrder[];
    orderFillableAmounts: BigNumber[];
    ethToOutputRate: BigNumber;
    ethToInputRate: BigNumber;
    rfqtIndicativeQuotes: RFQTIndicativeQuote[];
    twoHopQuotes: Array<DexSample<MultiHopFillData>>;
}

export interface TokenAdjacencyGraph {
    [token: string]: string[];
}
