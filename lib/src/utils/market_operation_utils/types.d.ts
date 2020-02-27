import { BigNumber } from '@0x/utils';
import { SignedOrderWithFillableAmounts } from '../../types';
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
export declare enum AggregationError {
    NoOptimalPath = "NO_OPTIMAL_PATH",
    EmptyOrders = "EMPTY_ORDERS",
    NotERC20AssetData = "NOT_ERC20ASSET_DATA",
    NoBridgeForSource = "NO_BRIDGE_FOR_SOURCE"
}
/**
 * DEX sources to aggregate.
 */
export declare enum ERC20BridgeSource {
    Native = "Native",
    Uniswap = "Uniswap",
    Eth2Dai = "Eth2Dai",
    Kyber = "Kyber",
    CurveUsdcDai = "Curve_USDC_DAI",
    CurveUsdcDaiUsdt = "Curve_USDC_DAI_USDT",
    CurveUsdcDaiUsdtTusd = "Curve_USDC_DAI_USDT_TUSD"
}
export interface FillData {
    source: ERC20BridgeSource;
}
export interface NativeFillData extends FillData {
    order: SignedOrderWithFillableAmounts;
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
export declare enum FillFlags {
    SourceNative = 1,
    SourceUniswap = 2,
    SourceEth2Dai = 4,
    SourceKyber = 8
}
/**
 * Represents a node on a fill path.
 */
export interface Fill {
    flags: FillFlags;
    exclusionMask: number;
    input: BigNumber;
    output: BigNumber;
    fillPenalty: BigNumber;
    parent?: Fill;
    fillData: FillData | NativeFillData;
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
     * Total maker asset amount.
     */
    totalMakerAssetAmount: BigNumber;
    /**
     * Total taker asset amount.
     */
    totalTakerAssetAmount: BigNumber;
    /**
     * All the fill asset amounts that were collapsed into this node.
     */
    subFills: Array<{
        makerAssetAmount: BigNumber;
        takerAssetAmount: BigNumber;
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
    fill: CollapsedFill;
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
     * Whether to prevent mixing Kyber orders with Uniswap and Eth2Dai orders.
     */
    noConflicts: boolean;
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
     * Number of samples to take for each DEX quote.
     */
    numSamples: number;
    /**
     * Dust amount, as a fraction of the fill amount.
     * Default is 0.01 (100 basis points).
     */
    dustFractionThreshold: number;
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
    fees: {
        [source: string]: BigNumber;
    };
}
//# sourceMappingURL=types.d.ts.map