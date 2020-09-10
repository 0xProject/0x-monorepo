import { BigNumber, hexUtils } from '@0x/utils';

import { MarketOperation, SignedOrderWithFillableAmounts } from '../../types';
import { fillableAmountsUtils } from '../../utils/fillable_amounts_utils';

import { POSITIVE_INF, SOURCE_FLAGS, ZERO_AMOUNT } from './constants';
import { DexSample, ERC20BridgeSource, FeeSchedule, Fill } from './types';

// tslint:disable: prefer-for-of no-bitwise completed-docs

/**
 * Create `Fill` objects from orders and dex quotes.
 */
export function createFills(opts: {
    side: MarketOperation;
    orders?: SignedOrderWithFillableAmounts[];
    dexQuotes?: DexSample[][];
    targetInput?: BigNumber;
    ethToOutputRate?: BigNumber;
    ethToInputRate?: BigNumber;
    excludedSources?: ERC20BridgeSource[];
    feeSchedule?: FeeSchedule;
}): Fill[][] {
    const { side } = opts;
    const excludedSources = opts.excludedSources || [];
    const feeSchedule = opts.feeSchedule || {};
    const orders = opts.orders || [];
    const dexQuotes = opts.dexQuotes || [];
    const ethToOutputRate = opts.ethToOutputRate || ZERO_AMOUNT;
    const ethToInputRate = opts.ethToInputRate || ZERO_AMOUNT;
    // Create native fills.
    const nativeFills = nativeOrdersToFills(
        side,
        orders,
        opts.targetInput,
        ethToOutputRate,
        ethToInputRate,
        feeSchedule,
    );
    // Create DEX fills.
    const dexFills = dexQuotes.map(singleSourceSamples =>
        dexSamplesToFills(side, singleSourceSamples, ethToOutputRate, ethToInputRate, feeSchedule),
    );
    return [...dexFills, nativeFills]
        .map(p => clipFillsToInput(p, opts.targetInput))
        .filter(fills => hasLiquidity(fills) && !excludedSources.includes(fills[0].source));
}

function clipFillsToInput(fills: Fill[], targetInput: BigNumber = POSITIVE_INF): Fill[] {
    const clipped: Fill[] = [];
    let input = ZERO_AMOUNT;
    for (const fill of fills) {
        if (input.gte(targetInput)) {
            break;
        }
        input = input.plus(fill.input);
        clipped.push(fill);
    }
    return clipped;
}

function hasLiquidity(fills: Fill[]): boolean {
    if (fills.length === 0) {
        return false;
    }
    const totalInput = BigNumber.sum(...fills.map(fill => fill.input));
    const totalOutput = BigNumber.sum(...fills.map(fill => fill.output));
    if (totalInput.isZero() || totalOutput.isZero()) {
        return false;
    }
    return true;
}

function nativeOrdersToFills(
    side: MarketOperation,
    orders: SignedOrderWithFillableAmounts[],
    targetInput: BigNumber = POSITIVE_INF,
    ethToOutputRate: BigNumber,
    ethToInputRate: BigNumber,
    fees: FeeSchedule,
): Fill[] {
    const sourcePathId = hexUtils.random();
    // Create a single path from all orders.
    let fills: Array<Fill & { adjustedRate: BigNumber }> = [];
    for (const order of orders) {
        const makerAmount = fillableAmountsUtils.getMakerAssetAmountSwappedAfterOrderFees(order);
        const takerAmount = fillableAmountsUtils.getTakerAssetAmountSwappedAfterOrderFees(order);
        const input = side === MarketOperation.Sell ? takerAmount : makerAmount;
        const output = side === MarketOperation.Sell ? makerAmount : takerAmount;
        const fee = fees[ERC20BridgeSource.Native] === undefined ? 0 : fees[ERC20BridgeSource.Native]!();
        const outputPenalty = !ethToOutputRate.isZero()
            ? ethToOutputRate.times(fee)
            : ethToInputRate.times(fee).times(output.dividedToIntegerBy(input));
        // targetInput can be less than the order size
        // whilst the penalty is constant, it affects the adjusted output
        // only up until the target has been exhausted.
        // A large order and an order at the exact target should be penalized
        // the same.
        const clippedInput = BigNumber.min(targetInput, input);
        // scale the clipped output inline with the input
        const clippedOutput = clippedInput.dividedBy(input).times(output);
        const adjustedOutput =
            side === MarketOperation.Sell ? clippedOutput.minus(outputPenalty) : clippedOutput.plus(outputPenalty);
        const adjustedRate =
            side === MarketOperation.Sell ? adjustedOutput.div(clippedInput) : clippedInput.div(adjustedOutput);
        // Skip orders with rates that are <= 0.
        if (adjustedRate.lte(0)) {
            continue;
        }
        fills.push({
            sourcePathId,
            adjustedRate,
            adjustedOutput,
            input: clippedInput,
            output: clippedOutput,
            flags: SOURCE_FLAGS[ERC20BridgeSource.Native],
            index: 0, // TBD
            parent: undefined, // TBD
            source: ERC20BridgeSource.Native,
            fillData: { order },
        });
    }
    // Sort by descending adjusted rate.
    fills = fills.sort((a, b) => b.adjustedRate.comparedTo(a.adjustedRate));
    // Re-index fills.
    for (let i = 0; i < fills.length; ++i) {
        fills[i].parent = i === 0 ? undefined : fills[i - 1];
        fills[i].index = i;
    }
    return fills;
}

function dexSamplesToFills(
    side: MarketOperation,
    samples: DexSample[],
    ethToOutputRate: BigNumber,
    ethToInputRate: BigNumber,
    fees: FeeSchedule,
): Fill[] {
    const sourcePathId = hexUtils.random();
    const fills: Fill[] = [];
    // Drop any non-zero entries. This can occur if the any fills on Kyber were UniswapReserves
    // We need not worry about Kyber fills going to UniswapReserve as the input amount
    // we fill is the same as we sampled. I.e we received [0,20,30] output from [1,2,3] input
    // and we only fill [2,3] on Kyber (as 1 returns 0 output)
    const nonzeroSamples = samples.filter(q => !q.output.isZero());
    for (let i = 0; i < nonzeroSamples.length; i++) {
        const sample = nonzeroSamples[i];
        const prevSample = i === 0 ? undefined : nonzeroSamples[i - 1];
        const { source, fillData } = sample;
        const input = sample.input.minus(prevSample ? prevSample.input : 0);
        const output = sample.output.minus(prevSample ? prevSample.output : 0);
        const fee = fees[source] === undefined ? 0 : fees[source]!(sample.fillData);
        let penalty = ZERO_AMOUNT;
        if (i === 0) {
            // Only the first fill in a DEX path incurs a penalty.
            penalty = !ethToOutputRate.isZero()
                ? ethToOutputRate.times(fee)
                : ethToInputRate.times(fee).times(output.dividedToIntegerBy(input));
        }
        const adjustedOutput = side === MarketOperation.Sell ? output.minus(penalty) : output.plus(penalty);

        fills.push({
            sourcePathId,
            input,
            output,
            adjustedOutput,
            source,
            fillData,
            index: i,
            parent: i !== 0 ? fills[fills.length - 1] : undefined,
            flags: SOURCE_FLAGS[source],
        });
    }
    return fills;
}
