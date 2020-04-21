import { BigNumber } from '@0x/utils';

import { constants } from '../constants';
import { MarketOperation } from '../types';

import { CollapsedFill, ERC20BridgeSource, OptimizedMarketOrder } from './market_operation_utils/types';
import { isOrderTakerFeePayableWithMakerAsset, isOrderTakerFeePayableWithTakerAsset } from './utils';

const { PROTOCOL_FEE_MULTIPLIER, ZERO_AMOUNT } = constants;
const { ROUND_DOWN, ROUND_UP } = BigNumber;

// tslint:disable completed-docs

export interface QuoteFillResult {
    // Maker asset bought.
    makerAssetAmount: BigNumber;
    // Taker asset sold.
    takerAssetAmount: BigNumber;
    // Taker fees that can be paid with the maker asset.
    takerFeeMakerAssetAmount: BigNumber;
    // Taker fees that can be paid with the taker asset.
    takerFeeTakerAssetAmount: BigNumber;
    // Total maker asset amount bought (including fees).
    totalMakerAssetAmount: BigNumber;
    // Total taker asset amount sold (including fees).
    totalTakerAssetAmount: BigNumber;
    // Protocol fees paid.
    protocolFeeAmount: BigNumber;
    // (Estimated) gas used.
    gas: number;
    // Fill amounts by source.
    // For sells, this is the taker assets sold.
    // For buys, this is the maker assets bought.
    fillAmountBySource: { [source: string]: BigNumber };
}

interface IntermediateQuoteFillResult {
    // Input tokens filled. Taker asset for sells, maker asset for buys.
    input: BigNumber;
    // Output tokens filled. Maker asset for sells, taker asset for buys.
    output: BigNumber;
    // Taker fees that can be paid with the input token.
    // Positive for sells, negative for buys.
    inputFee: BigNumber;
    // Taker fees that can be paid with the output token.
    // Negative for sells, positive for buys.
    outputFee: BigNumber;
    // Protocol fees paid.
    protocolFee: BigNumber;
    // (Estimated) gas used.
    gas: number;
    // Input amounts filled by sources.
    inputBySource: { [source: string]: BigNumber };
}

const EMPTY_QUOTE_INTERMEDIATE_FILL_RESULT = {
    input: ZERO_AMOUNT,
    output: ZERO_AMOUNT,
    outputFee: ZERO_AMOUNT,
    inputFee: ZERO_AMOUNT,
    protocolFee: ZERO_AMOUNT,
    gas: 0,
};

export interface QuoteFillInfo {
    orders: OptimizedMarketOrder[];
    fillAmount: BigNumber;
    gasPrice: BigNumber;
    side: MarketOperation;
    opts: Partial<QuoteFillInfoOpts>;
}

export interface QuoteFillInfoOpts {
    gasSchedule: { [soruce: string]: number };
    protocolFeeMultiplier: BigNumber;
}

const DEFAULT_SIMULATED_FILL_QUOTE_INFO_OPTS: QuoteFillInfoOpts = {
    gasSchedule: {},
    protocolFeeMultiplier: PROTOCOL_FEE_MULTIPLIER,
};

export interface QuoteFillOrderCall {
    order: OptimizedMarketOrder;
    // Total input amount defined in the order.
    totalOrderInput: BigNumber;
    // Total output amount defined in the order.
    totalOrderOutput: BigNumber;
    // Total fees payable with input token, defined in the order.
    // Positive for sells, negative for buys.
    totalOrderInputFee: BigNumber;
    // Total fees payable with output token, defined in the order.
    // Negative for sells, positive for buys.
    totalOrderOutputFee: BigNumber;
}

// Simulates filling a quote in the best case.
export function simulateBestCaseFill(quoteInfo: QuoteFillInfo): QuoteFillResult {
    const opts = {
        ...DEFAULT_SIMULATED_FILL_QUOTE_INFO_OPTS,
        ...quoteInfo.opts,
    };
    const result = fillQuoteOrders(
        createBestCaseFillOrderCalls(quoteInfo),
        quoteInfo.fillAmount,
        quoteInfo.gasPrice.times(opts.protocolFeeMultiplier),
        opts.gasSchedule,
    );
    return fromIntermediateQuoteFillResult(result, quoteInfo);
}

// Simulates filling a quote in the worst case.
export function simulateWorstCaseFill(quoteInfo: QuoteFillInfo): QuoteFillResult {
    const opts = {
        ...DEFAULT_SIMULATED_FILL_QUOTE_INFO_OPTS,
        ...quoteInfo.opts,
    };
    const protocolFeePerFillOrder = quoteInfo.gasPrice.times(opts.protocolFeeMultiplier);
    const result = {
        ...fillQuoteOrders(
            createWorstCaseFillOrderCalls(quoteInfo),
            quoteInfo.fillAmount,
            protocolFeePerFillOrder,
            opts.gasSchedule,
        ),
        // Worst case gas and protocol fee is hitting all orders.
        gas: getTotalGasUsedBySources(
            getFlattenedFillsFromOrders(quoteInfo.orders).map(s => s.source),
            opts.gasSchedule,
        ),
        protocolFee: protocolFeePerFillOrder.times(quoteInfo.orders.length),
    };
    return fromIntermediateQuoteFillResult(result, quoteInfo);
}

export function fillQuoteOrders(
    fillOrders: QuoteFillOrderCall[],
    inputAmount: BigNumber,
    protocolFeePerFillOrder: BigNumber,
    gasSchedule: { [source: string]: number },
): IntermediateQuoteFillResult {
    const result: IntermediateQuoteFillResult = {
        ...EMPTY_QUOTE_INTERMEDIATE_FILL_RESULT,
        inputBySource: {},
    };
    let remainingInput = inputAmount;
    for (const fo of fillOrders) {
        if (remainingInput.lte(0)) {
            break;
        }
        for (const fill of fo.order.fills) {
            if (remainingInput.lte(0)) {
                break;
            }
            const { source } = fill;
            result.gas += gasSchedule[source] || 0;
            result.inputBySource[source] = result.inputBySource[source] || ZERO_AMOUNT;

            // Actual rates are rarely linear, so fill subfills individually to
            // get a better approximation of fill size.
            for (const subFill of fill.subFills) {
                if (remainingInput.lte(0)) {
                    break;
                }
                const filledInput = solveForInputFillAmount(
                    remainingInput,
                    subFill.input,
                    fo.totalOrderInput,
                    fo.totalOrderInputFee,
                );
                const filledOutput = subFill.output.times(filledInput.div(subFill.input));
                const filledInputFee = filledInput.div(fo.totalOrderInput).times(fo.totalOrderInputFee);
                const filledOutputFee = filledOutput.div(fo.totalOrderOutput).times(fo.totalOrderOutputFee);

                result.inputBySource[source] = result.inputBySource[source].plus(filledInput);
                result.input = result.input.plus(filledInput);
                result.output = result.output.plus(filledOutput);
                result.inputFee = result.inputFee.plus(filledInputFee);
                result.outputFee = result.outputFee.plus(filledOutputFee);
                remainingInput = remainingInput.minus(filledInput.plus(filledInputFee));
            }
        }
        result.protocolFee = result.protocolFee.plus(protocolFeePerFillOrder);
    }
    return result;
}

function solveForInputFillAmount(
    remainingInput: BigNumber,
    fillableInput: BigNumber,
    totalOrderInput: BigNumber,
    totalOrderInputFee: BigNumber,
): BigNumber {
    // When accounting for input token taker fees, the effective input amount is
    // given by:
    //   i' = i + f * i / o
    // where:
    //   i' - The effective input amount, including fees
    //   i  - An input amount
    //   f  - totalOrderInputFee
    //   o  - totalOrderInput
    // Solving for i we get:
    //   i = (i' * o) / (f + o)
    const denom = totalOrderInput.plus(totalOrderInputFee);
    if (denom.eq(0)) {
        // A zero denominator would imply an order whose fees are >= the input
        // token amount.
        // For sells, takerFeeAmount >= takerAssetAmount (technically OK but really undesirable).
        // For buys, takerFeeAmount >= makerAssetAmount (losing all your returns to fees).
        return fillableInput;
    }
    return BigNumber.min(
        fillableInput,
        // let i' = remainingInput
        remainingInput.times(totalOrderInput).div(denom),
    );
}

function createBestCaseFillOrderCalls(quoteInfo: QuoteFillInfo): QuoteFillOrderCall[] {
    const { orders, side } = quoteInfo;
    return orders.map(o => ({
        order: o,
        ...(side === MarketOperation.Sell
            ? {
                  totalOrderInput: o.takerAssetAmount,
                  totalOrderOutput: o.makerAssetAmount,
                  totalOrderInputFee: isOrderTakerFeePayableWithTakerAsset(o) ? o.takerFee : ZERO_AMOUNT,
                  totalOrderOutputFee: isOrderTakerFeePayableWithMakerAsset(o) ? o.takerFee.negated() : ZERO_AMOUNT,
              }
            : // Buy
              {
                  totalOrderInput: o.makerAssetAmount,
                  totalOrderOutput: o.takerAssetAmount,
                  totalOrderInputFee: isOrderTakerFeePayableWithMakerAsset(o) ? o.takerFee.negated() : ZERO_AMOUNT,
                  totalOrderOutputFee: isOrderTakerFeePayableWithTakerAsset(o) ? o.takerFee : ZERO_AMOUNT,
              }),
    }));
}

function createWorstCaseFillOrderCalls(quoteInfo: QuoteFillInfo): QuoteFillOrderCall[] {
    // Reuse best case fill orders.
    return createBestCaseFillOrderCalls(quoteInfo)
        .map(fo => ({
            ...fo,
            order: {
                ...fo.order,
                // Apply slippage to order fills and reverse them.
                fills: getSlippedOrderFills(fo.order, quoteInfo.side).reverse(),
            },
            // Reverse the orders.
        }))
        .reverse();
}

// Apply order slippage to its fill paths.
function getSlippedOrderFills(order: OptimizedMarketOrder, side: MarketOperation): CollapsedFill[] {
    const totalInput = BigNumber.sum(...order.fills.map(f => f.input));
    const totalOutput = BigNumber.sum(...order.fills.map(f => f.output));
    const inputScaling =
        side === MarketOperation.Sell
            ? order.fillableTakerAssetAmount.div(totalInput)
            : order.fillableMakerAssetAmount.div(totalInput);
    const outputScaling =
        side === MarketOperation.Sell
            ? order.fillableMakerAssetAmount.div(totalOutput)
            : order.fillableTakerAssetAmount.div(totalOutput);
    return order.fills.map(f => ({
        ...f,
        input: f.input.times(inputScaling),
        output: f.output.times(outputScaling),
        subFills: f.subFills.map(sf => ({
            ...sf,
            input: sf.input.times(inputScaling),
            output: sf.output.times(outputScaling),
        })),
    }));
}

function roundInputAmount(amount: BigNumber, side: MarketOperation): BigNumber {
    return amount.integerValue(side === MarketOperation.Sell ? ROUND_UP : ROUND_DOWN);
}

function roundOutputAmount(amount: BigNumber, side: MarketOperation): BigNumber {
    return amount.integerValue(side === MarketOperation.Sell ? ROUND_DOWN : ROUND_UP);
}

function roundIntermediateFillResult(
    ir: IntermediateQuoteFillResult,
    side: MarketOperation,
): IntermediateQuoteFillResult {
    return {
        input: roundInputAmount(ir.input, side),
        output: roundOutputAmount(ir.output, side),
        inputFee: roundInputAmount(ir.inputFee, side),
        outputFee: roundOutputAmount(ir.outputFee, side),
        protocolFee: ir.protocolFee.integerValue(ROUND_UP),
        gas: Math.ceil(ir.gas),
        inputBySource: Object.assign(
            {},
            ...Object.entries(ir.inputBySource).map(([k, v]) => ({ [k]: roundInputAmount(v, side) })),
        ),
    };
}

function fromIntermediateQuoteFillResult(ir: IntermediateQuoteFillResult, quoteInfo: QuoteFillInfo): QuoteFillResult {
    const { side } = quoteInfo;
    const _ir = roundIntermediateFillResult(ir, side);
    return {
        ...(side === MarketOperation.Sell
            ? // Sell
              {
                  makerAssetAmount: _ir.output,
                  takerAssetAmount: _ir.input,
                  takerFeeMakerAssetAmount: _ir.outputFee,
                  takerFeeTakerAssetAmount: _ir.inputFee,
                  totalMakerAssetAmount: _ir.output.plus(_ir.outputFee),
                  totalTakerAssetAmount: _ir.input.plus(_ir.inputFee),
              }
            : // Buy
              {
                  makerAssetAmount: _ir.input,
                  takerAssetAmount: _ir.output,
                  takerFeeMakerAssetAmount: _ir.inputFee,
                  takerFeeTakerAssetAmount: _ir.outputFee,
                  totalMakerAssetAmount: _ir.input.plus(_ir.inputFee),
                  totalTakerAssetAmount: _ir.output.plus(_ir.outputFee),
              }),
        protocolFeeAmount: _ir.protocolFee,
        gas: _ir.gas,
        fillAmountBySource: _ir.inputBySource,
    };
}

export function getFlattenedFillsFromOrders(orders: OptimizedMarketOrder[]): CollapsedFill[] {
    const fills: CollapsedFill[] = [];
    for (const o of orders) {
        fills.push(...o.fills);
    }
    return fills;
}

function getTotalGasUsedBySources(sources: ERC20BridgeSource[], gasSchedule: { [source: string]: number }): number {
    let gasUsed = 0;
    for (const s of sources) {
        gasUsed += gasSchedule[s] || 0;
    }
    return gasUsed;
}
