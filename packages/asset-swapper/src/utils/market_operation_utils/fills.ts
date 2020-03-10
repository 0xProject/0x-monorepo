import { BigNumber } from '@0x/utils';

import { MarketOperation, SignedOrderWithFillableAmounts } from '../../types';
import { fillableAmountsUtils } from '../../utils/fillable_amounts_utils';

import { POSITIVE_INF, ZERO_AMOUNT } from './constants';
import {
    CollapsedFill,
    DexSample,
    ERC20BridgeSource,
    Fill,
    FillFlags,
    NativeCollapsedFill,
    NativeFillData,
} from './types';

// tslint:disable: prefer-for-of no-bitwise completed-docs

/**
 * Create fill paths from orders and dex quotes.
 */
export function createFillPaths(opts: {
    side: MarketOperation;
    orders?: SignedOrderWithFillableAmounts[];
    dexQuotes?: DexSample[][];
    targetInput?: BigNumber;
    ethToOutputRate?: BigNumber;
    excludedSources?: ERC20BridgeSource[];
    feeSchedule?: { [source: string]: BigNumber };
}): Fill[][] {
    const { side } = opts;
    const excludedSources = opts.excludedSources || [];
    const feeSchedule = opts.feeSchedule || {};
    const orders = opts.orders || [];
    const dexQuotes = opts.dexQuotes || [];
    const ethToOutputRate = opts.ethToOutputRate || ZERO_AMOUNT;
    // Create native fill paths.
    const nativePath = nativeOrdersToPath(side, orders, ethToOutputRate, feeSchedule);
    // Create DEX fill paths.
    const dexPaths = dexQuotesToPaths(side, dexQuotes, ethToOutputRate, feeSchedule);
    return filterPaths([...dexPaths, nativePath].map(p => clipPathToInput(p, opts.targetInput)), excludedSources);
}

function filterPaths(paths: Fill[][], excludedSources: ERC20BridgeSource[]): Fill[][] {
    return paths.filter(path => {
        if (path.length === 0) {
            return false;
        }
        const [input, output] = getPathSize(path);
        if (input.eq(0) || output.eq(0)) {
            return false;
        }
        if (excludedSources.includes(path[0].source)) {
            return false;
        }
        return true;
    });
}

function nativeOrdersToPath(
    side: MarketOperation,
    orders: SignedOrderWithFillableAmounts[],
    ethToOutputRate: BigNumber,
    fees: { [source: string]: BigNumber },
): Fill[] {
    // Create a single path from all orders.
    let path: Fill[] = [];
    for (const order of orders) {
        const makerAmount = fillableAmountsUtils.getMakerAssetAmountSwappedAfterOrderFees(order);
        const takerAmount = fillableAmountsUtils.getTakerAssetAmountSwappedAfterOrderFees(order);
        const input = side === MarketOperation.Sell ? takerAmount : makerAmount;
        const output = side === MarketOperation.Sell ? makerAmount : takerAmount;
        const penalty = ethToOutputRate.times(fees[ERC20BridgeSource.Native] || 0);
        const adjustedOutput = side === MarketOperation.Sell ? output.minus(penalty) : output.plus(penalty);
        const rate = makerAmount.div(takerAmount);
        const adjustedRate =
            side === MarketOperation.Sell
                ? makerAmount.minus(penalty).div(takerAmount)
                : makerAmount.div(takerAmount.plus(penalty));
        // Skip orders with rates that are <= 0.
        if (adjustedRate.lte(0)) {
            continue;
        }
        path.push({
            input,
            output,
            rate,
            adjustedRate,
            adjustedOutput,
            index: path.length,
            flags: 0,
            parent: path.length !== 0 ? path[path.length - 1] : undefined,
            source: ERC20BridgeSource.Native,
            fillData: { order },
        });
    }
    // Sort by descending rate.
    path = path.sort((a, b) => b.rate.comparedTo(a.rate));
    // Re-index fills.
    for (let i = 0; i < path.length; ++i) {
        path[i].parent = i === 0 ? undefined : path[i - 1];
        path[i].index = i;
    }
    return path;
}

function dexQuotesToPaths(
    side: MarketOperation,
    dexQuotes: DexSample[][],
    ethToOutputRate: BigNumber,
    fees: { [source: string]: BigNumber },
): Fill[][] {
    const paths: Fill[][] = [];
    for (const quote of dexQuotes) {
        const path: Fill[] = [];
        for (let i = 0; i < quote.length; i++) {
            const sample = quote[i];
            const prevSample = i === 0 ? undefined : quote[i - 1];
            const source = sample.source;
            // Stop of the sample has zero output, which can occur if the source
            // cannot fill the full amount.
            // TODO(dorothy-zbornak): Sometimes Kyber will dip to zero then pick back up.
            if (sample.output.eq(0)) {
                break;
            }
            const input = sample.input.minus(prevSample ? prevSample.input : 0);
            const output = sample.output.minus(prevSample ? prevSample.output : 0);
            const penalty =
                i === 0 // Only the first fill in a DEX path incurs a penalty.
                    ? ethToOutputRate.times(fees[source] || 0)
                    : ZERO_AMOUNT;
            const adjustedOutput = side === MarketOperation.Sell ? output.minus(penalty) : output.plus(penalty);
            const rate = side === MarketOperation.Sell ? output.div(input) : input.div(output);
            const adjustedRate =
                side === MarketOperation.Sell ? output.minus(penalty).div(input) : input.div(output.plus(penalty));

            path.push({
                input,
                output,
                rate,
                adjustedRate,
                adjustedOutput,
                source,
                index: i,
                parent: i !== 0 ? path[path.length - 1] : undefined,
                flags: sourceToFillFlags(source),
            });
        }
        paths.push(path);
    }
    return paths;
}

function sourceToFillFlags(source: ERC20BridgeSource): number {
    if (source === ERC20BridgeSource.Kyber) {
        return FillFlags.Kyber;
    }
    if (source === ERC20BridgeSource.Eth2Dai) {
        return FillFlags.ConflictsWithKyber;
    }
    if (source === ERC20BridgeSource.Uniswap) {
        return FillFlags.ConflictsWithKyber;
    }
    return 0;
}

export function getPathSize(path: Fill[], targetInput: BigNumber = POSITIVE_INF): [BigNumber, BigNumber] {
    let input = ZERO_AMOUNT;
    let output = ZERO_AMOUNT;
    for (const fill of path) {
        if (input.plus(fill.input).gte(targetInput)) {
            const di = targetInput.minus(input).div(fill.input);
            input = input.plus(di);
            output = output.plus(fill.output.times(di.div(fill.input)));
            break;
        } else {
            input = input.plus(fill.input);
            output = output.plus(fill.output);
        }
    }
    return [input.integerValue(), output.integerValue()];
}

export function getPathAdjustedSize(path: Fill[], targetInput: BigNumber = POSITIVE_INF): [BigNumber, BigNumber] {
    let input = ZERO_AMOUNT;
    let output = ZERO_AMOUNT;
    for (const fill of path) {
        if (input.plus(fill.input).gte(targetInput)) {
            const di = targetInput.minus(input).div(fill.input);
            input = input.plus(di);
            output = output.plus(fill.adjustedOutput.times(di.div(fill.input)));
            break;
        } else {
            input = input.plus(fill.input);
            output = output.plus(fill.adjustedOutput);
        }
    }
    return [input.integerValue(), output.integerValue()];
}

export function isValidPath(path: Fill[]): boolean {
    let flags = 0;
    for (let i = 0; i < path.length; ++i) {
        // Fill must immediately follow its parent.
        if (path[i].parent) {
            if (i === 0 || path[i - 1] !== path[i].parent) {
                return false;
            }
        }
        // Fill must not be duplicated.
        for (let j = 0; j < i; ++j) {
            if (path[i] === path[j]) {
                return false;
            }
        }
        flags |= path[i].flags;
    }
    const conflictFlags = FillFlags.Kyber | FillFlags.ConflictsWithKyber;
    return (flags & conflictFlags) !== conflictFlags;
}

export function clipPathToInput(path: Fill[], targetInput: BigNumber = POSITIVE_INF): Fill[] {
    const clipped: Fill[] = [];
    let input = ZERO_AMOUNT;
    for (const fill of path) {
        if (input.gte(targetInput)) {
            break;
        }
        input = input.plus(fill.input);
        clipped.push(fill);
    }
    return clipped;
}

export function collapsePath(side: MarketOperation, path: Fill[]): CollapsedFill[] {
    const collapsed: Array<CollapsedFill | NativeCollapsedFill> = [];
    for (const fill of path) {
        const makerAssetAmount = side === MarketOperation.Sell ? fill.output : fill.input;
        const takerAssetAmount = side === MarketOperation.Sell ? fill.input : fill.output;
        const source = fill.source;
        if (collapsed.length !== 0 && source !== ERC20BridgeSource.Native) {
            const prevFill = collapsed[collapsed.length - 1];
            // If the last fill is from the same source, merge them.
            if (prevFill.source === source) {
                prevFill.totalMakerAssetAmount = prevFill.totalMakerAssetAmount.plus(makerAssetAmount);
                prevFill.totalTakerAssetAmount = prevFill.totalTakerAssetAmount.plus(takerAssetAmount);
                prevFill.subFills.push({ makerAssetAmount, takerAssetAmount });
                continue;
            }
        }
        collapsed.push({
            source: fill.source,
            totalMakerAssetAmount: makerAssetAmount,
            totalTakerAssetAmount: takerAssetAmount,
            subFills: [{ makerAssetAmount, takerAssetAmount }],
            nativeOrder: fill.source === ERC20BridgeSource.Native ? (fill.fillData as NativeFillData).order : undefined,
        });
    }
    return collapsed;
}

export function getFallbackSourcePaths(optimalPath: Fill[], allPaths: Fill[][]): Fill[][] {
    const optimalSources: ERC20BridgeSource[] = [];
    for (const fill of optimalPath) {
        if (!optimalSources.includes(fill.source)) {
            optimalSources.push(fill.source);
        }
    }
    const fallbackPaths: Fill[][] = [];
    for (const path of allPaths) {
        if (optimalSources.includes(path[0].source)) {
            continue;
        }
        // HACK(dorothy-zbornak): We *should* be filtering out paths that
        // conflict with the optimal path (i.e., Kyber conflicts), but in
        // practice we often end up not being able to find a fallback path
        // because we've lost 2 major liquiduty sources. The end result is
        // we end up with many more reverts than what would be actually caused
        // by conflicts.
        fallbackPaths.push(path);
    }
    return fallbackPaths;
}
