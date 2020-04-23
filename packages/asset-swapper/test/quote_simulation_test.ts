import { constants, expect, getRandomInteger, randomAddress } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { MarketOperation } from '../src/types';
import { CollapsedFill, ERC20BridgeSource, OptimizedMarketOrder } from '../src/utils/market_operation_utils/types';
import {
    fillQuoteOrders,
    QuoteFillOrderCall,
    simulateBestCaseFill,
    simulateWorstCaseFill,
} from '../src/utils/quote_simulation';

// tslint:disable: custom-no-magic-numbers

describe('quote_simulation tests', async () => {
    const { NULL_ADDRESS } = constants;
    const ZERO = new BigNumber(0);
    const ONE = new BigNumber(1);
    const MAKER_TOKEN = randomAddress();
    const TAKER_TOKEN = randomAddress();
    const DEFAULT_MAKER_ASSET_DATA = assetDataUtils.encodeERC20AssetData(MAKER_TOKEN);
    const DEFAULT_TAKER_ASSET_DATA = assetDataUtils.encodeERC20AssetData(TAKER_TOKEN);
    const GAS_SCHEDULE = { [ERC20BridgeSource.Native]: 1 };

    // Check if two numbers are within `maxError` error rate within each other (default 1 bps).
    function assertRoughlyEquals(n1: BigNumber, n2: BigNumber, maxError: BigNumber | number = 1e-12): void {
        // |n2-n1| / max(|n1|, |n2|)
        const err = n2
            .minus(n1)
            .abs()
            .div(BigNumber.max(n1.abs(), n2.abs()));
        expect(err).to.bignumber.lt(maxError);
    }

    function createQuoteFillOrders(
        opts: Partial<{
            fillableInput: BigNumber;
            fillableOutput: BigNumber;
            inputFeeRate: number;
            outputFeeRate: number;
            count: number;
            fillsCount: number;
            side: MarketOperation;
        }> = {},
    ): QuoteFillOrderCall[] {
        const { fillableInput, fillableOutput, inputFeeRate, outputFeeRate, count, fillsCount, side } = {
            fillableInput: getRandomOrderSize(),
            fillableOutput: getRandomOrderSize(),
            inputFeeRate: 0,
            outputFeeRate: 0,
            count: 3,
            fillsCount: 3,
            side: MarketOperation.Sell,
            ...opts,
        };
        const _inputFeeRate = side === MarketOperation.Sell ? inputFeeRate : -inputFeeRate;
        const _outputFeeRate = side === MarketOperation.Sell ? -outputFeeRate : outputFeeRate;

        const fillableInputs = subdivideAmount(fillableInput, count);
        const fillableOutputs = subdivideAmount(fillableOutput, count);
        const filledInputs = subdivideAmount(fillableInput.times(0.5), count);
        const filledOutputs: BigNumber[] = [];
        const totalInputs: BigNumber[] = [];
        const totalOutputs: BigNumber[] = [];
        const inputFees: BigNumber[] = [];
        const outputFees: BigNumber[] = [];
        _.times(count).forEach(i => {
            const f = filledInputs[i].div(fillableInputs[i]);
            filledOutputs.push(fillableOutputs[i].times(f).integerValue(BigNumber.ROUND_DOWN));
            totalInputs.push(fillableInputs[i].plus(filledInputs[i]));
            totalOutputs.push(fillableOutputs[i].plus(filledOutputs[i]));
            inputFees.push(totalInputs[i].times(_inputFeeRate).integerValue());
            outputFees.push(totalOutputs[i].times(_outputFeeRate).integerValue());
        });
        return _.times(count, i => {
            return {
                order: createQuoteFillOrderOrder(totalInputs[i], totalOutputs[i], {
                    side,
                    fillsCount,
                    filledInput: filledInputs[i],
                    takerInputFee: inputFees[i].abs(),
                    takerOutputFee: outputFees[i].abs(),
                }),
                totalOrderInput: totalInputs[i],
                totalOrderOutput: totalOutputs[i],
                totalOrderInputFee: inputFees[i],
                totalOrderOutputFee: outputFees[i],
            };
        });
    }

    function createQuoteFillOrderOrder(
        input: BigNumber,
        output: BigNumber,
        opts: Partial<{
            filledInput: BigNumber;
            fillsCount: number;
            side: MarketOperation;
            takerInputFee: BigNumber;
            takerOutputFee: BigNumber;
        }> = {},
    ): OptimizedMarketOrder {
        const { filledInput, fillsCount, side, takerInputFee, takerOutputFee } = {
            side: MarketOperation.Sell,
            filledInput: ZERO,
            fillsCount: 3,
            takerInputFee: ZERO,
            takerOutputFee: ZERO,
            ...opts,
        };
        const filledOutput = filledInput
            .div(input)
            .times(output)
            .integerValue(BigNumber.ROUND_DOWN);
        const fillableInput = input.minus(filledInput);
        const fillableOutput = output.minus(filledOutput);
        const makerAssetAmount = side === MarketOperation.Sell ? output : input;
        const takerAssetAmount = side === MarketOperation.Sell ? input : output;
        const fillableMakerAssetAmount = side === MarketOperation.Sell ? fillableOutput : fillableInput;
        const fillableTakerAssetAmount = side === MarketOperation.Sell ? fillableInput : fillableOutput;
        const takerFee = BigNumber.max(takerInputFee, takerOutputFee);
        let takerFeeAssetData = '0x';
        if (!takerInputFee.eq(0)) {
            takerFeeAssetData = side === MarketOperation.Sell ? DEFAULT_TAKER_ASSET_DATA : DEFAULT_MAKER_ASSET_DATA;
        } else if (!takerOutputFee.eq(0)) {
            takerFeeAssetData = side === MarketOperation.Sell ? DEFAULT_MAKER_ASSET_DATA : DEFAULT_TAKER_ASSET_DATA;
        }
        const fillableTakerFeeAmount = fillableTakerAssetAmount
            .div(takerAssetAmount)
            .times(takerFee)
            .integerValue(BigNumber.ROUND_DOWN);
        return {
            makerAssetAmount,
            takerAssetAmount,
            fillableTakerAssetAmount,
            fillableMakerAssetAmount,
            fillableTakerFeeAmount,
            takerFee,
            takerFeeAssetData,
            fills: createOrderCollapsedFills(fillableInput, fillableOutput, fillsCount),
            chainId: 1,
            exchangeAddress: NULL_ADDRESS,
            expirationTimeSeconds: ZERO,
            feeRecipientAddress: NULL_ADDRESS,
            senderAddress: NULL_ADDRESS,
            makerAddress: NULL_ADDRESS,
            takerAddress: NULL_ADDRESS,
            makerAssetData: DEFAULT_MAKER_ASSET_DATA,
            takerAssetData: DEFAULT_TAKER_ASSET_DATA,
            makerFeeAssetData: '0x',
            salt: ZERO,
            makerFee: ZERO,
            signature: '0x',
        };
    }

    function createOrderCollapsedFills(input: BigNumber, output: BigNumber, count: number): CollapsedFill[] {
        const inputs = subdivideAmount(input, count);
        const outputs = subdivideAmount(output, count);
        return _.times(count, i => {
            const subFillInputs = subdivideAmount(inputs[i], count);
            const subFillOutputs = subdivideAmount(outputs[i], count);
            return {
                source: ERC20BridgeSource.Native,
                input: inputs[i],
                output: outputs[i],
                subFills: _.times(count, j => ({
                    input: subFillInputs[j],
                    output: subFillOutputs[j],
                })),
            };
        });
    }

    function countCollapsedFills(fillOrders: QuoteFillOrderCall[] | OptimizedMarketOrder[]): number {
        let count = 0;
        if ((fillOrders as any)[0].fills) {
            const orders = (fillOrders as any) as OptimizedMarketOrder[];
            for (const o of orders) {
                count += o.fills.length;
            }
        } else {
            const orders = (fillOrders as any) as QuoteFillOrderCall[];
            for (const fo of orders) {
                count += fo.order.fills.length;
            }
        }
        return count;
    }

    function randomSide(): MarketOperation {
        return _.sampleSize(Object.values(MarketOperation), 1)[0];
    }

    function getRandomOrderSize(): BigNumber {
        return getRandomInteger('100e18', '1000e18');
    }

    function getRandomFeeRate(): number {
        return _.random(0.01, 0.25, true);
    }

    function assertEqualRates(actual: number | BigNumber, expected: number | BigNumber): void {
        expect(new BigNumber(actual).times(1e4).integerValue()).to.bignumber.eq(
            new BigNumber(expected).times(1e4).integerValue(),
        );
    }

    function subdivideAmount(amount: BigNumber, count: number): BigNumber[] {
        const amounts = [];
        for (let i = 0; i < count; ++i) {
            const remaining = amount.minus(BigNumber.sum(0, ...amounts));
            if (i !== count - 1) {
                amounts.push(remaining.times(Math.random()).integerValue());
            } else {
                amounts.push(remaining.integerValue());
            }
        }
        return amounts;
    }

    describe('fillQuoteOrders()', () => {
        describe('single order', () => {
            it('can exactly fill one order', () => {
                const side = randomSide();
                const fillsCount = _.random(1, 3);
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    side,
                    fillsCount,
                    count: 1,
                });
                const result = fillQuoteOrders(fillOrders, fillableInput, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                expect(totalFilledInput).to.bignumber.eq(fillableInput);
                assertRoughlyEquals(totalFilledOutput, fillableOutput);
                expect(result.protocolFee).to.bignumber.eq(1);
                expect(result.gas).to.eq(fillsCount);
            });

            it('can partially fill one simple order', () => {
                const side = randomSide();
                const fillsCount = 1;
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    side,
                    fillsCount,
                    count: 1,
                });
                const inputFillAmount = fillableInput.times(2 / 3).integerValue();
                const result = fillQuoteOrders(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                expect(totalFilledInput).to.bignumber.eq(inputFillAmount);
                const expectedOutputFilledAmount = inputFillAmount
                    .div(fillableInput)
                    .times(fillableOutput)
                    .integerValue();
                assertRoughlyEquals(totalFilledOutput, expectedOutputFilledAmount);
                expect(result.protocolFee).to.bignumber.eq(1);
                expect(result.gas).to.eq(1);
            });

            it('can partially fill one batched order', () => {
                const side = randomSide();
                const fillsCount = 3;
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    side,
                    fillsCount,
                    count: 1,
                });
                const inputFillAmount = fillableInput.times(2 / 3).integerValue();
                const result = fillQuoteOrders(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                expect(totalFilledInput).to.bignumber.eq(inputFillAmount);
                expect(totalFilledOutput).to.bignumber.lt(fillableOutput);
                expect(result.protocolFee).to.bignumber.eq(1);
                expect(result.gas).to.gte(1);
                expect(result.gas).to.lte(fillsCount);
            });

            it('does not over fill one order', () => {
                const side = randomSide();
                const fillsCount = _.random(1, 3);
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    side,
                    fillsCount,
                    count: 1,
                });
                const inputFillAmount = fillableInput.times(3 / 2).integerValue();
                const result = fillQuoteOrders(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                expect(totalFilledInput).to.bignumber.eq(fillableInput);
                assertRoughlyEquals(totalFilledOutput, fillableOutput);
                expect(result.protocolFee).to.bignumber.eq(1);
                expect(result.gas).to.eq(fillsCount);
            });

            it('can exactly fill one order with input fees', () => {
                const side = randomSide();
                const fillsCount = _.random(1, 3);
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const inputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    inputFeeRate,
                    side,
                    fillsCount,
                    count: 1,
                });
                const signedInputFeeRate = side === MarketOperation.Sell ? inputFeeRate : -inputFeeRate;
                const totalFillableInput = fillableInput.times(signedInputFeeRate + 1).integerValue();
                const result = fillQuoteOrders(fillOrders, totalFillableInput, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, totalFillableInput);
                assertRoughlyEquals(totalFilledOutput, fillableOutput);
                assertEqualRates(result.inputFee.div(result.input), signedInputFeeRate);
                expect(result.protocolFee).to.bignumber.eq(1);
                expect(result.gas).to.eq(fillsCount);
            });

            it('can partially fill one order with input fees', () => {
                const side = randomSide();
                const fillsCount = _.random(1, 3);
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const inputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    inputFeeRate,
                    side,
                    fillsCount,
                    count: 1,
                });
                const signedInputFeeRate = side === MarketOperation.Sell ? inputFeeRate : -inputFeeRate;
                const totalFillableInput = fillableInput.times(signedInputFeeRate + 1).integerValue();
                const inputFillAmount = totalFillableInput.times(2 / 3).integerValue();
                const result = fillQuoteOrders(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, inputFillAmount);
                expect(totalFilledOutput).to.bignumber.lt(fillableOutput);
                assertEqualRates(result.inputFee.div(result.input), signedInputFeeRate);
                expect(result.protocolFee).to.bignumber.eq(1);
                expect(result.gas).to.lte(fillsCount);
            });

            it('does not over fill one order with input fees', () => {
                const side = randomSide();
                const fillsCount = _.random(1, 3);
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const inputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    inputFeeRate,
                    side,
                    fillsCount,
                    count: 1,
                });
                const signedInputFeeRate = side === MarketOperation.Sell ? inputFeeRate : -inputFeeRate;
                const totalFillableInput = fillableInput.times(signedInputFeeRate + 1).integerValue();
                const inputFillAmount = totalFillableInput.times(3 / 2).integerValue();
                const result = fillQuoteOrders(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, totalFillableInput);
                assertRoughlyEquals(totalFilledOutput, fillableOutput);
                assertEqualRates(result.inputFee.div(result.input), signedInputFeeRate);
                expect(result.protocolFee).to.bignumber.eq(1);
                expect(result.gas).to.eq(fillsCount);
            });

            it('can exactly fill one order with output fees', () => {
                const side = randomSide();
                const fillsCount = _.random(1, 3);
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const outputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    outputFeeRate,
                    side,
                    fillsCount,
                    count: 1,
                });
                const signedOutputFeeRate = side === MarketOperation.Sell ? -outputFeeRate : outputFeeRate;
                const totalFillableOutput = fillableOutput.times(signedOutputFeeRate + 1).integerValue();
                const result = fillQuoteOrders(fillOrders, fillableInput, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, fillableInput);
                assertRoughlyEquals(totalFilledOutput, totalFillableOutput);
                assertEqualRates(result.outputFee.div(result.output), signedOutputFeeRate);
                expect(result.protocolFee).to.bignumber.eq(1);
                expect(result.gas).to.eq(fillsCount);
            });

            it('can partial fill one order with output fees', () => {
                const side = randomSide();
                const fillsCount = _.random(1, 3);
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const outputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    outputFeeRate,
                    side,
                    fillsCount,
                    count: 1,
                });
                const signedOutputFeeRate = side === MarketOperation.Sell ? -outputFeeRate : outputFeeRate;
                const totalFillableOutput = fillableOutput.times(signedOutputFeeRate + 1).integerValue();
                const inputFillAmount = fillableInput.times(2 / 3).integerValue();
                const result = fillQuoteOrders(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, inputFillAmount);
                expect(totalFilledOutput).to.bignumber.lt(totalFillableOutput);
                assertEqualRates(result.outputFee.div(result.output), signedOutputFeeRate);
                expect(result.protocolFee).to.bignumber.eq(1);
                expect(result.gas).to.lte(fillsCount);
            });

            it('does not over fill one order with output fees', () => {
                const side = randomSide();
                const fillsCount = _.random(1, 3);
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const outputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    outputFeeRate,
                    side,
                    fillsCount,
                    count: 1,
                });
                const signedOutputFeeRate = side === MarketOperation.Sell ? -outputFeeRate : outputFeeRate;
                const totalFillableOutput = fillableOutput.times(signedOutputFeeRate + 1).integerValue();
                const inputFillAmount = fillableInput.times(3 / 2).integerValue();
                const result = fillQuoteOrders(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, fillableInput);
                assertRoughlyEquals(totalFilledOutput, totalFillableOutput);
                assertEqualRates(result.outputFee.div(result.output), signedOutputFeeRate);
                expect(result.protocolFee).to.bignumber.eq(1);
                expect(result.gas).to.eq(fillsCount);
            });
        });

        describe('multiple orders', () => {
            it('can exactly fill orders', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const fillOrders = createQuoteFillOrders({ fillableInput, fillableOutput, side });
                const result = fillQuoteOrders(fillOrders, fillableInput, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                expect(totalFilledInput).to.bignumber.eq(fillableInput);
                expect(totalFilledOutput).to.bignumber.eq(fillableOutput);
                expect(result.protocolFee).to.bignumber.eq(fillOrders.length);
                expect(result.gas).to.eq(countCollapsedFills(fillOrders));
            });

            it('can partial fill orders', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const inputFillAmount = fillableInput.times(2 / 3).integerValue();
                const fillOrders = createQuoteFillOrders({ fillableInput, fillableOutput, side });
                const result = fillQuoteOrders(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                expect(totalFilledInput).to.bignumber.eq(inputFillAmount);
                expect(totalFilledOutput).to.bignumber.lt(fillableOutput);
                expect(result.protocolFee).to.bignumber.gte(1);
            });

            it('does not over fill orders', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const inputFillAmount = fillableInput.times(3 / 2).integerValue();
                const fillOrders = createQuoteFillOrders({ fillableInput, fillableOutput, side });
                const result = fillQuoteOrders(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                expect(totalFilledInput).to.bignumber.eq(fillableInput);
                expect(totalFilledOutput).to.bignumber.eq(fillableOutput);
                expect(result.protocolFee).to.bignumber.eq(fillOrders.length);
                expect(result.gas).to.eq(countCollapsedFills(fillOrders));
            });

            it('can exactly fill orders with input fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const inputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    inputFeeRate,
                    side,
                });
                const signedInputFeeRate = side === MarketOperation.Sell ? inputFeeRate : -inputFeeRate;
                const totalFillableInput = fillableInput.times(signedInputFeeRate + 1).integerValue();
                const result = fillQuoteOrders(fillOrders, totalFillableInput, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, totalFillableInput);
                assertRoughlyEquals(totalFilledOutput, fillableOutput);
                assertEqualRates(result.inputFee.div(result.input), signedInputFeeRate);
                expect(result.protocolFee).to.bignumber.eq(fillOrders.length);
                expect(result.gas).to.eq(countCollapsedFills(fillOrders));
            });

            it('can partial fill orders with input fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const inputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    inputFeeRate,
                    side,
                });
                const signedInputFeeRate = side === MarketOperation.Sell ? inputFeeRate : -inputFeeRate;
                const totalFillableInput = fillableInput.times(signedInputFeeRate + 1).integerValue();
                const inputFillAmount = totalFillableInput.times(2 / 3).integerValue();
                const result = fillQuoteOrders(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, inputFillAmount);
                expect(totalFilledOutput).to.bignumber.lt(fillableOutput);
                assertEqualRates(result.inputFee.div(result.input), signedInputFeeRate);
                expect(result.protocolFee).to.bignumber.lte(fillOrders.length);
                expect(result.gas).to.lte(countCollapsedFills(fillOrders));
            });

            it('does not over fill orders with input fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const inputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    inputFeeRate,
                    side,
                });
                const signedInputFeeRate = side === MarketOperation.Sell ? inputFeeRate : -inputFeeRate;
                const totalFillableInput = fillableInput.times(signedInputFeeRate + 1).integerValue();
                const inputFillAmount = totalFillableInput.times(3 / 2).integerValue();
                const result = fillQuoteOrders(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, totalFillableInput);
                assertRoughlyEquals(totalFilledOutput, fillableOutput);
                assertEqualRates(result.inputFee.div(result.input), signedInputFeeRate);
                expect(result.protocolFee).to.bignumber.eq(fillOrders.length);
                expect(result.gas).to.eq(countCollapsedFills(fillOrders));
            });

            it('can exactly fill orders with output fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const outputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    outputFeeRate,
                    side,
                });
                const signedOutputFeeRate = side === MarketOperation.Sell ? -outputFeeRate : outputFeeRate;
                const totalFillableOutput = fillableOutput.times(signedOutputFeeRate + 1).integerValue();
                const result = fillQuoteOrders(fillOrders, fillableInput, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, fillableInput);
                assertRoughlyEquals(totalFilledOutput, totalFillableOutput);
                assertEqualRates(result.outputFee.div(result.output), signedOutputFeeRate);
                expect(result.protocolFee).to.bignumber.eq(fillOrders.length);
                expect(result.gas).to.eq(countCollapsedFills(fillOrders));
            });

            it('can partial fill orders with output fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const outputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    outputFeeRate,
                    side,
                });
                const signedOutputFeeRate = side === MarketOperation.Sell ? -outputFeeRate : outputFeeRate;
                const totalFillableOutput = fillableOutput.times(signedOutputFeeRate + 1).integerValue();
                const inputFillAmount = fillableInput.times(2 / 3).integerValue();
                const result = fillQuoteOrders(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, inputFillAmount);
                expect(totalFilledOutput).to.bignumber.lt(totalFillableOutput);
                assertEqualRates(result.outputFee.div(result.output), signedOutputFeeRate);
                expect(result.protocolFee).to.bignumber.lte(fillOrders.length);
                expect(result.gas).to.lte(countCollapsedFills(fillOrders));
            });

            it('does not over fill orders with output fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const outputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    outputFeeRate,
                    side,
                });
                const signedOutputFeeRate = side === MarketOperation.Sell ? -outputFeeRate : outputFeeRate;
                const totalFillableOutput = fillableOutput.times(signedOutputFeeRate + 1).integerValue();
                const inputFillAmount = fillableInput.times(3 / 2).integerValue();
                const result = fillQuoteOrders(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, fillableInput);
                assertRoughlyEquals(totalFilledOutput, totalFillableOutput);
                assertEqualRates(result.outputFee.div(result.output), signedOutputFeeRate);
                expect(result.protocolFee).to.bignumber.eq(fillOrders.length);
                expect(result.gas).to.eq(countCollapsedFills(fillOrders));
            });
        });
    });

    function slipOrder(
        order: OptimizedMarketOrder,
        orderSlippage: number,
        side: MarketOperation,
    ): OptimizedMarketOrder {
        const makerScaling = side === MarketOperation.Sell ? 1 - orderSlippage : 1;
        const takerScaling = side === MarketOperation.Sell ? 1 : orderSlippage + 1;
        return {
            ...order,
            makerAssetAmount: order.makerAssetAmount.times(makerScaling),
            fillableMakerAssetAmount: order.fillableMakerAssetAmount.times(makerScaling),
            takerAssetAmount: order.takerAssetAmount.times(takerScaling),
            fillableTakerAssetAmount: order.fillableTakerAssetAmount.times(takerScaling),
        };
    }

    describe('simulateBestCaseFill()', () => {
        it('ignores order slippage', async () => {
            const side = randomSide();
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const orderSlippage = getRandomFeeRate();
            const orders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                side,
            }).map(fo => slipOrder(fo.order, orderSlippage, side));
            const result = simulateBestCaseFill({
                orders,
                side,
                fillAmount: fillableInput,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE },
            });
            if (side === MarketOperation.Sell) {
                expect(result.totalMakerAssetAmount).to.be.bignumber.eq(fillableOutput);
                expect(result.totalTakerAssetAmount).to.be.bignumber.eq(fillableInput);
            } else {
                expect(result.totalMakerAssetAmount).to.be.bignumber.eq(fillableInput);
                expect(result.totalTakerAssetAmount).to.be.bignumber.eq(fillableOutput);
            }
        });

        it('can fully fill orders', async () => {
            const side = randomSide();
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const orders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                side,
            }).map(fo => fo.order);
            const result = simulateBestCaseFill({
                orders,
                side,
                fillAmount: fillableInput,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE },
            });
            expect(result.gas).to.eq(countCollapsedFills(orders));
            expect(result.protocolFeeAmount).to.bignumber.gt(orders.length);
            expect(result.takerFeeTakerAssetAmount).to.bignumber.eq(0);
            expect(result.takerFeeMakerAssetAmount).to.bignumber.eq(0);
            expect(result.makerAssetAmount).to.bignumber.eq(result.totalMakerAssetAmount);
            expect(result.takerAssetAmount).to.bignumber.eq(result.totalTakerAssetAmount);
            if (side === MarketOperation.Sell) {
                expect(result.totalMakerAssetAmount).to.be.bignumber.eq(fillableOutput);
                expect(result.totalTakerAssetAmount).to.be.bignumber.eq(fillableInput);
            } else {
                expect(result.totalMakerAssetAmount).to.be.bignumber.eq(fillableInput);
                expect(result.totalTakerAssetAmount).to.be.bignumber.eq(fillableOutput);
            }
        });

        it('can partial fill orders', async () => {
            const side = randomSide();
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const orders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                side,
            }).map(fo => fo.order);
            const inputFillAmount = fillableInput.times(Math.random()).integerValue();
            const result = simulateBestCaseFill({
                orders,
                side,
                fillAmount: inputFillAmount,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE },
            });
            expect(result.gas).to.gt(0);
            expect(result.protocolFeeAmount).to.bignumber.gt(0);
            expect(result.takerFeeTakerAssetAmount).to.bignumber.eq(0);
            expect(result.takerFeeMakerAssetAmount).to.bignumber.eq(0);
            expect(result.makerAssetAmount).to.bignumber.eq(result.totalMakerAssetAmount);
            expect(result.takerAssetAmount).to.bignumber.eq(result.totalTakerAssetAmount);
            if (side === MarketOperation.Sell) {
                expect(result.totalMakerAssetAmount).to.be.bignumber.lt(fillableOutput);
                expect(result.totalTakerAssetAmount).to.be.bignumber.eq(inputFillAmount);
            } else {
                expect(result.totalMakerAssetAmount).to.be.bignumber.eq(inputFillAmount);
                expect(result.totalTakerAssetAmount).to.be.bignumber.lt(fillableOutput);
            }
        });

        it('can fully fill orders with input fees', async () => {
            const side = randomSide();
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const inputFeeRate = getRandomFeeRate();
            const orders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                inputFeeRate,
                side,
            }).map(fo => fo.order);
            const signedInputFeeRate = side === MarketOperation.Sell ? inputFeeRate : -inputFeeRate;
            const totalFillableInput = fillableInput.times(signedInputFeeRate + 1).integerValue();
            const result = simulateBestCaseFill({
                orders,
                side,
                fillAmount: totalFillableInput,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE },
            });
            expect(result.gas).to.eq(countCollapsedFills(orders));
            expect(result.protocolFeeAmount).to.bignumber.gt(orders.length);
            if (side === MarketOperation.Sell) {
                assertRoughlyEquals(result.takerAssetAmount, fillableInput);
                assertRoughlyEquals(result.totalTakerAssetAmount, totalFillableInput);
                assertRoughlyEquals(result.makerAssetAmount, fillableOutput);
                assertRoughlyEquals(result.totalMakerAssetAmount, fillableOutput);
                expect(result.makerAssetAmount).to.bignumber.eq(result.totalMakerAssetAmount);
                expect(result.takerFeeMakerAssetAmount).to.bignumber.eq(0);
            } else {
                assertRoughlyEquals(result.makerAssetAmount, fillableInput);
                assertRoughlyEquals(result.totalMakerAssetAmount, totalFillableInput);
                assertRoughlyEquals(result.takerAssetAmount, fillableOutput);
                assertRoughlyEquals(result.totalTakerAssetAmount, fillableOutput);
                expect(result.takerAssetAmount).to.bignumber.eq(result.totalTakerAssetAmount);
                expect(result.takerFeeTakerAssetAmount).to.bignumber.eq(0);
            }
        });

        it('can partially fill orders with input fees', async () => {
            const side = randomSide();
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const inputFeeRate = getRandomFeeRate();
            const orders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                inputFeeRate,
                side,
            }).map(fo => fo.order);
            const signedInputFeeRate = side === MarketOperation.Sell ? inputFeeRate : -inputFeeRate;
            const totalFillableInput = fillableInput.times(signedInputFeeRate + 1).integerValue();
            const inputFillAmount = totalFillableInput.times(2 / 3).integerValue();
            const result = simulateBestCaseFill({
                orders,
                side,
                fillAmount: inputFillAmount,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE },
            });
            expect(result.gas).to.gt(0);
            expect(result.protocolFeeAmount).to.bignumber.gt(0);
            if (side === MarketOperation.Sell) {
                assertRoughlyEquals(result.totalTakerAssetAmount, inputFillAmount);
                expect(result.makerAssetAmount).to.bignumber.lt(fillableOutput);
                expect(result.makerAssetAmount).to.bignumber.eq(result.totalMakerAssetAmount);
                expect(result.takerFeeMakerAssetAmount).to.bignumber.eq(0);
            } else {
                assertRoughlyEquals(result.totalMakerAssetAmount, inputFillAmount);
                expect(result.takerAssetAmount).to.bignumber.lt(fillableOutput);
                expect(result.takerAssetAmount).to.bignumber.eq(result.totalTakerAssetAmount);
                expect(result.takerFeeTakerAssetAmount).to.bignumber.eq(0);
            }
        });

        it('can fully fill orders with output fees', async () => {
            const side = randomSide();
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const outputFeeRate = getRandomFeeRate();
            const orders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                outputFeeRate,
                side,
            }).map(fo => fo.order);
            const signedOutputFeeRate = side === MarketOperation.Sell ? -outputFeeRate : outputFeeRate;
            const totalFillableOutput = fillableOutput.times(signedOutputFeeRate + 1).integerValue();
            const result = simulateBestCaseFill({
                orders,
                side,
                fillAmount: fillableInput,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE },
            });
            expect(result.gas).to.eq(countCollapsedFills(orders));
            expect(result.protocolFeeAmount).to.bignumber.gt(orders.length);
            if (side === MarketOperation.Sell) {
                assertRoughlyEquals(result.takerAssetAmount, fillableInput);
                assertRoughlyEquals(result.totalTakerAssetAmount, fillableInput);
                assertRoughlyEquals(result.makerAssetAmount, fillableOutput);
                assertRoughlyEquals(result.totalMakerAssetAmount, totalFillableOutput);
                expect(result.takerAssetAmount).to.bignumber.eq(result.totalTakerAssetAmount);
                expect(result.takerFeeTakerAssetAmount).to.bignumber.eq(0);
            } else {
                assertRoughlyEquals(result.makerAssetAmount, fillableInput);
                assertRoughlyEquals(result.totalMakerAssetAmount, fillableInput);
                assertRoughlyEquals(result.takerAssetAmount, fillableOutput);
                assertRoughlyEquals(result.totalTakerAssetAmount, totalFillableOutput);
                expect(result.makerAssetAmount).to.bignumber.eq(result.totalMakerAssetAmount);
                expect(result.takerFeeMakerAssetAmount).to.bignumber.eq(0);
            }
        });

        it('can partially fill orders with output fees', async () => {
            const side = randomSide();
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const outputFeeRate = getRandomFeeRate();
            const orders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                outputFeeRate,
                side,
            }).map(fo => fo.order);
            const inputFillAmount = fillableInput.times(2 / 3).integerValue();
            const result = simulateBestCaseFill({
                orders,
                side,
                fillAmount: inputFillAmount,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE },
            });
            expect(result.gas).to.gt(0);
            expect(result.protocolFeeAmount).to.bignumber.gt(0);
            if (side === MarketOperation.Sell) {
                assertRoughlyEquals(result.totalTakerAssetAmount, inputFillAmount);
                expect(result.makerAssetAmount).to.bignumber.lt(fillableOutput);
                expect(result.takerAssetAmount).to.bignumber.eq(result.totalTakerAssetAmount);
                expect(result.takerFeeTakerAssetAmount).to.bignumber.eq(0);
            } else {
                assertRoughlyEquals(result.totalMakerAssetAmount, inputFillAmount);
                expect(result.takerAssetAmount).to.bignumber.lt(fillableOutput);
                expect(result.makerAssetAmount).to.bignumber.eq(result.totalMakerAssetAmount);
                expect(result.takerFeeMakerAssetAmount).to.bignumber.eq(0);
            }
        });
    });

    describe('simulateWorstCaseFill()', () => {
        it('includes order slippage', async () => {
            const side = randomSide();
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const orderSlippage = getRandomFeeRate();
            const orders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                side,
            }).map(fo => slipOrder(fo.order, orderSlippage, side));
            const result = simulateWorstCaseFill({
                orders,
                side,
                fillAmount: fillableInput,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE },
            });
            if (side === MarketOperation.Sell) {
                const slippedOutput = fillableOutput.times(1 - orderSlippage).integerValue();
                assertRoughlyEquals(result.totalMakerAssetAmount, slippedOutput);
                assertRoughlyEquals(result.totalTakerAssetAmount, fillableInput);
            } else {
                const slippedOutput = fillableOutput.times(orderSlippage + 1).integerValue();
                assertRoughlyEquals(result.totalMakerAssetAmount, fillableInput);
                assertRoughlyEquals(result.totalTakerAssetAmount, slippedOutput);
            }
        });
    });
}); // tslint:disable: max-file-line-count
