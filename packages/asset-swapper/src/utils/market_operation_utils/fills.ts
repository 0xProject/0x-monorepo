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
    ethToOutputRate?: BigNumber;
    excludedSources?: ERC20BridgeSource[];
    fees?: { [source: string]: BigNumber };
}): Fill[][] {
    const { side } = opts;
    const excludedSources = opts.excludedSources || [];
    const fees = opts.fees || {};
    const orders = opts.orders || [];
    const dexQuotes = opts.dexQuotes || [];
    const ethToOutputRate = opts.ethToOutputRate || ZERO_AMOUNT;
    // Create native fill paths.
    const nativeFills = orders.map(o => nativeOrderToPath(side, o, ethToOutputRate, fees));
    // Create DEX fill paths.
    const dexPaths = dexQuotesToPaths(side, dexQuotes, ethToOutputRate, fees);
    return filterPaths([...dexPaths, ...nativeFills], excludedSources);
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

function nativeOrderToPath(
    side: MarketOperation,
    order: SignedOrderWithFillableAmounts,
    ethToOutputRate: BigNumber,
    fees: { [source: string]: BigNumber },
): Fill[] {
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
    // Native orders can be filled in any order, so they're all root nodes.
    return [
        {
            input,
            output,
            rate,
            adjustedRate,
            adjustedOutput,
            index: 0,
            flags: 0,
            source: ERC20BridgeSource.Native,
            fillData: {
                order,
            },
        },
    ];
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

export function getPathSize(path: Fill[], maxInput: BigNumber = POSITIVE_INF): [BigNumber, BigNumber] {
    let input = ZERO_AMOUNT;
    let output = ZERO_AMOUNT;
    for (const fill of path) {
        if (input.plus(fill.input).gte(maxInput)) {
            const di = maxInput.minus(input).div(fill.input);
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

export function getPathAdjustedSize(path: Fill[], maxInput: BigNumber = POSITIVE_INF): [BigNumber, BigNumber] {
    let input = ZERO_AMOUNT;
    let output = ZERO_AMOUNT;
    for (const fill of path) {
        if (input.plus(fill.input).gte(maxInput)) {
            const di = maxInput.minus(input).div(fill.input);
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
        if (path[i].parent) {
            if (i === 0 || path[i - 1] !== path[i].parent) {
                return false;
            }
        }
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

export function getUnusedSourcePaths(usedPath: Fill[], allPaths: Fill[][]): Fill[][] {
    const usedSources = usedPath.map(f => f.source);
    return allPaths.filter(p => !usedSources.includes(p[0].source));
}
