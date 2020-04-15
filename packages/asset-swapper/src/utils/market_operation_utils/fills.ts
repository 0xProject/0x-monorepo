import { BigNumber } from '@0x/utils';

import { MarketOperation, SignedOrderWithFillableAmounts } from '../../types';
import { fillableAmountsUtils } from '../../utils/fillable_amounts_utils';
import { RfqtIndicativeQuoteResponse } from '../quote_requestor';

import { POSITIVE_INF, ZERO_AMOUNT } from './constants';
import {
    CollapsedFill,
    DexSample,
    ERC20BridgeSource,
    Fill,
    FillFlags,
    NativeCollapsedFill,
    NativeFillData,
    RfqtCollapsedFill,
    RfqtFillData,
} from './types';

// tslint:disable: prefer-for-of no-bitwise completed-docs

/**
 * Create fill paths from orders and dex quotes.
 */
export function createFillPaths(opts: {
    side: MarketOperation;
    orders?: SignedOrderWithFillableAmounts[];
    dexQuotes?: DexSample[][];
    rfqtIndicativeQuotes?: RfqtIndicativeQuoteResponse[];
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
    const rfqtIndicativeQuotes = opts.rfqtIndicativeQuotes || [];
    const ethToOutputRate = opts.ethToOutputRate || ZERO_AMOUNT;
    // Create native fill paths.
    const nativePath = nativeOrdersToPath(side, orders, ethToOutputRate, feeSchedule);
    // Create DEX fill paths.
    const dexPaths = dexQuotesToPaths(side, dexQuotes, ethToOutputRate, feeSchedule);
    // Create RFQ-T indicative quote fill paths
    const rfqtIndicativeQuotePath = rfqtIndicativeQuotesToPath(
        side,
        rfqtIndicativeQuotes,
        ethToOutputRate,
        feeSchedule,
    );
    return filterPaths(
        [...dexPaths, nativePath, rfqtIndicativeQuotePath].map(p => clipPathToInput(p, opts.targetInput)),
        excludedSources,
    );
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
            const adjustedRate = side === MarketOperation.Sell ? adjustedOutput.div(input) : input.div(adjustedOutput);

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

function rfqtIndicativeQuotesToPath(
    side: MarketOperation,
    quotes: RfqtIndicativeQuoteResponse[],
    ethToOutputRate: BigNumber,
    fees: { [source: string]: BigNumber },
): Fill[] {
    // Create a single path from all orders.
    let path: Fill[] = [];
    for (const quote of quotes) {
        const makerAmount = quote.makerAssetAmount;
        const takerAmount = quote.takerAssetAmount;
        const input = side === MarketOperation.Sell ? takerAmount : makerAmount;
        const output = side === MarketOperation.Sell ? makerAmount : takerAmount;
        const penalty = 0;
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
            adjustedOutput: output,
            flags: 0,
            index: 0, // TBD
            parent: undefined, // TBD
            source: ERC20BridgeSource.Rfqt,
            fillData: { quote, side },
        });
    }
    // Sort by descending adjusted rate.
    path = path.sort((a, b) => b.adjustedRate.comparedTo(a.adjustedRate));
    /* copy-pasted the following from nativeOrdersToPath(). not really sure i need it.
    // Re-index fills.
    for (let i = 0; i < path.length; ++i) {
        path[i].parent = i === 0 ? undefined : path[i - 1];
        path[i].index = i;
    }
    */
    return path;
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
            output = output.plus(fill.adjustedOutput.times(di.div(fill.input)));
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

export function collapsePath(path: Fill[]): CollapsedFill[] {
    const collapsed: Array<CollapsedFill | NativeCollapsedFill | RfqtCollapsedFill> = [];
    for (const fill of path) {
        const source = fill.source;
        if (collapsed.length !== 0 && source !== ERC20BridgeSource.Native) {
            const prevFill = collapsed[collapsed.length - 1];
            // If the last fill is from the same source, merge them.
            if (prevFill.source === source) {
                prevFill.input = prevFill.input.plus(fill.input);
                prevFill.output = prevFill.output.plus(fill.output);
                prevFill.subFills.push(fill);
                continue;
            }
        }
        collapsed.push({
            source: fill.source,
            input: fill.input,
            output: fill.output,
            subFills: [fill],
            nativeOrder: fill.source === ERC20BridgeSource.Native ? (fill.fillData as NativeFillData).order : undefined,
            quote: fill.source === ERC20BridgeSource.Rfqt ? (fill.fillData as RfqtFillData).quote : undefined,
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
