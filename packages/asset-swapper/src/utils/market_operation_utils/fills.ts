import { BigNumber, hexUtils } from '@0x/utils';

import { MarketOperation, SignedOrderWithFillableAmounts } from '../../types';
import { fillableAmountsUtils } from '../../utils/fillable_amounts_utils';

import { POSITIVE_INF, ZERO_AMOUNT } from './constants';
import { CollapsedFill, DexSample, ERC20BridgeSource, FeeSchedule, Fill, FillFlags } from './types';

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
    feeSchedule?: FeeSchedule;
}): Fill[][] {
    const { side } = opts;
    const excludedSources = opts.excludedSources || [];
    const feeSchedule = opts.feeSchedule || {};
    const orders = opts.orders || [];
    const dexQuotes = opts.dexQuotes || [];
    const ethToOutputRate = opts.ethToOutputRate || ZERO_AMOUNT;
    // Create native fill paths.
    const nativePath = nativeOrdersToPath(side, orders, opts.targetInput, ethToOutputRate, feeSchedule);
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
    targetInput: BigNumber = POSITIVE_INF,
    ethToOutputRate: BigNumber,
    fees: FeeSchedule,
): Fill[] {
    const sourcePathId = hexUtils.random();
    // Create a single path from all orders.
    let path: Fill[] = [];
    for (const order of orders) {
        const makerAmount = fillableAmountsUtils.getMakerAssetAmountSwappedAfterOrderFees(order);
        const takerAmount = fillableAmountsUtils.getTakerAssetAmountSwappedAfterOrderFees(order);
        const input = side === MarketOperation.Sell ? takerAmount : makerAmount;
        const output = side === MarketOperation.Sell ? makerAmount : takerAmount;
        const penalty = ethToOutputRate.times(
            fees[ERC20BridgeSource.Native] === undefined ? 0 : fees[ERC20BridgeSource.Native]!(),
        );
        const rate = makerAmount.div(takerAmount);
        // targetInput can be less than the order size
        // whilst the penalty is constant, it affects the adjusted output
        // only up until the target has been exhausted.
        // A large order and an order at the exact target should be penalized
        // the same.
        const clippedInput = BigNumber.min(targetInput, input);
        // scale the clipped output inline with the input
        const clippedOutput = clippedInput.dividedBy(input).times(output);
        const adjustedOutput =
            side === MarketOperation.Sell ? clippedOutput.minus(penalty) : clippedOutput.plus(penalty);
        const adjustedRate =
            side === MarketOperation.Sell ? adjustedOutput.div(clippedInput) : clippedInput.div(adjustedOutput);
        // Skip orders with rates that are <= 0.
        if (adjustedRate.lte(0)) {
            continue;
        }
        path.push({
            sourcePathId,
            input: clippedInput,
            output: clippedOutput,
            rate,
            adjustedRate,
            adjustedOutput,
            flags: 0,
            index: 0, // TBD
            parent: undefined, // TBD
            source: ERC20BridgeSource.Native,
            fillData: { order },
        });
    }
    // Sort by descending adjusted rate.
    path = path.sort((a, b) => b.adjustedRate.comparedTo(a.adjustedRate));
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
    fees: FeeSchedule,
): Fill[][] {
    const paths: Fill[][] = [];
    for (let quote of dexQuotes) {
        const sourcePathId = hexUtils.random();
        const path: Fill[] = [];
        // Drop any non-zero entries. This can occur if the any fills on Kyber were UniswapReserves
        // We need not worry about Kyber fills going to UniswapReserve as the input amount
        // we fill is the same as we sampled. I.e we received [0,20,30] output from [1,2,3] input
        // and we only fill [2,3] on Kyber (as 1 returns 0 output)
        quote = quote.filter(q => !q.output.isZero());
        for (let i = 0; i < quote.length; i++) {
            const sample = quote[i];
            const prevSample = i === 0 ? undefined : quote[i - 1];
            const { source, fillData } = sample;
            const input = sample.input.minus(prevSample ? prevSample.input : 0);
            const output = sample.output.minus(prevSample ? prevSample.output : 0);
            const fee = fees[source] === undefined ? 0 : fees[source]!(sample.fillData);
            const penalty =
                i === 0 // Only the first fill in a DEX path incurs a penalty.
                    ? ethToOutputRate.times(fee)
                    : ZERO_AMOUNT;
            const adjustedOutput = side === MarketOperation.Sell ? output.minus(penalty) : output.plus(penalty);
            const rate = side === MarketOperation.Sell ? output.div(input) : input.div(output);
            const adjustedRate = side === MarketOperation.Sell ? adjustedOutput.div(input) : input.div(adjustedOutput);

            path.push({
                sourcePathId,
                input,
                output,
                rate,
                adjustedRate,
                adjustedOutput,
                source,
                fillData,
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
    switch (source) {
        case ERC20BridgeSource.Uniswap:
            return FillFlags.ConflictsWithMultiBridge;
        case ERC20BridgeSource.LiquidityProvider:
            return FillFlags.ConflictsWithMultiBridge;
        case ERC20BridgeSource.MultiBridge:
            return FillFlags.MultiBridge;
        default:
            return 0;
    }
}

export function getPathSize(path: Fill[], targetInput: BigNumber = POSITIVE_INF): [BigNumber, BigNumber] {
    let input = ZERO_AMOUNT;
    let output = ZERO_AMOUNT;
    for (const fill of path) {
        if (input.plus(fill.input).gte(targetInput)) {
            const di = targetInput.minus(input);
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
            const di = targetInput.minus(input);
            input = input.plus(di);
            // Penalty does not get interpolated.
            const penalty = fill.adjustedOutput.minus(fill.output);
            output = output.plus(fill.output.times(di.div(fill.input)).plus(penalty));
            break;
        } else {
            input = input.plus(fill.input);
            output = output.plus(fill.adjustedOutput);
        }
    }
    return [input.integerValue(), output.integerValue()];
}

export function isValidPath(path: Fill[], skipDuplicateCheck: boolean = false): boolean {
    let flags = 0;
    for (let i = 0; i < path.length; ++i) {
        // Fill must immediately follow its parent.
        if (path[i].parent) {
            if (i === 0 || path[i - 1] !== path[i].parent) {
                return false;
            }
        }
        if (!skipDuplicateCheck) {
            // Fill must not be duplicated.
            for (let j = 0; j < i; ++j) {
                if (path[i] === path[j]) {
                    return false;
                }
            }
        }
        flags |= path[i].flags;
    }
    return arePathFlagsAllowed(flags);
}

export function arePathFlagsAllowed(flags: number): boolean {
    const multiBridgeConflict = FillFlags.MultiBridge | FillFlags.ConflictsWithMultiBridge;
    return (flags & multiBridgeConflict) !== multiBridgeConflict;
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

export function collapsePath(path: Fill[]): CollapsedFill[] {
    const collapsed: CollapsedFill[] = [];
    for (const fill of path) {
        const source = fill.source;
        if (collapsed.length !== 0 && source !== ERC20BridgeSource.Native) {
            const prevFill = collapsed[collapsed.length - 1];
            // If the last fill is from the same source, merge them.
            if (prevFill.sourcePathId === fill.sourcePathId) {
                prevFill.input = prevFill.input.plus(fill.input);
                prevFill.output = prevFill.output.plus(fill.output);
                prevFill.subFills.push(fill);
                continue;
            }
        }
        collapsed.push({
            sourcePathId: fill.sourcePathId,
            source: fill.source,
            fillData: fill.fillData,
            input: fill.input,
            output: fill.output,
            subFills: [fill],
        });
    }
    return collapsed;
}

export function getPathAdjustedCompleteRate(side: MarketOperation, path: Fill[], targetInput: BigNumber): BigNumber {
    const [input, output] = getPathAdjustedSize(path, targetInput);
    if (input.eq(0) || output.eq(0) || targetInput.eq(0)) {
        return ZERO_AMOUNT;
    }
    // Penalize paths that fall short of the entire input amount by a factor of
    // input / targetInput => (i / t)
    if (side === MarketOperation.Sell) {
        // (o / i) * (i / t) => (o / t)
        return output.div(targetInput);
    }
    // (i / o) * (i / t)
    return input.div(output).times(input.div(targetInput));
}

export function getPathAdjustedRate(side: MarketOperation, path: Fill[], targetInput: BigNumber): BigNumber {
    const [input, output] = getPathAdjustedSize(path, targetInput);
    if (input.eq(0) || output.eq(0)) {
        return ZERO_AMOUNT;
    }
    return side === MarketOperation.Sell ? output.div(input) : input.div(output);
}

export function getPathAdjustedSlippage(
    side: MarketOperation,
    path: Fill[],
    inputAmount: BigNumber,
    maxRate: BigNumber,
): number {
    if (maxRate.eq(0)) {
        return 0;
    }
    const totalRate = getPathAdjustedRate(side, path, inputAmount);
    const rateChange = maxRate.minus(totalRate);
    return rateChange.div(maxRate).toNumber();
}
