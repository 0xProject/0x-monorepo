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
    Eth2Dai = 'Eth2Dai',
    Kyber = 'Kyber',
}

// Internal `fillData` field for `Fill` objects.
export interface FillData {
    source: ERC20BridgeSource;
}

// `FillData` for native fills.
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
export enum FillFlags {
    SourceNative = 0x1,
    SourceUniswap = 0x2,
    SourceEth2Dai = 0x4,
    SourceKyber = 0x8,
}

/**
 * Represents a node on a fill path.
 */
export interface Fill {
    // See `FillFlags`.
    flags: FillFlags;
    // `FillFlags` that are incompatible with this fill, e.g., to prevent
    // Kyber from mixing with Uniswap and Eth2Dai and vice versa.
    exclusionMask: number;
    // Input fill amount (taker asset amount in a sell, maker asset amount in a buy).
    input: BigNumber;
    // Output fill amount (maker asset amount in a sell, taker asset amount in a buy).
    output: BigNumber;
    // Fill that must precede this one. This enforces certain fills to be contiguous.
    parent?: Fill;
    // Data associated with this this Fill object. Used to reconstruct orders
    // from paths.
    fillData: FillData | NativeFillData;
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
}
