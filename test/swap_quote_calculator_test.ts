import { orderFactory } from '@0x/order-utils/lib/src/order_factory';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import { constants } from '../src/constants';
import { OrdersAndFillableAmounts, SwapQuoterError } from '../src/types';
import { swapQuoteCalculator } from '../src/utils/swap_quote_calculator';

import { chaiSetup } from './utils/chai_setup';
import { testHelpers } from './utils/test_helpers';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:max-file-line-count
// tslint:disable:custom-no-magic-numbers
describe('swapQuoteCalculator', () => {
    describe('#calculateMarketSellSwapQuote', () => {
        let firstOrder: SignedOrder;
        let firstRemainingFillAmount: BigNumber;
        let secondOrder: SignedOrder;
        let secondRemainingFillAmount: BigNumber;
        let ordersAndFillableAmounts: OrdersAndFillableAmounts;
        let smallFeeOrderAndFillableAmount: OrdersAndFillableAmounts;
        let allFeeOrdersAndFillableAmounts: OrdersAndFillableAmounts;
        beforeEach(() => {
            // generate two orders for our desired maker asset
            // the first order has a rate of 4 makerAsset / WETH with a takerFee of 200 ZRX and has only 200 / 400 makerAsset units left to fill (half fillable)
            // the second order has a rate of 2 makerAsset / WETH with a takerFee of 100 ZRX and has 200 / 200 makerAsset units left to fill (completely fillable)
            // generate one order for fees
            // the fee order has a rate of 1 ZRX / WETH with no taker fee and has 100 ZRX left to fill (completely fillable)
            firstOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: new BigNumber(400),
                takerAssetAmount: new BigNumber(100),
                takerFee: new BigNumber(200),
            });
            firstRemainingFillAmount = new BigNumber(200);
            secondOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: new BigNumber(200),
                takerAssetAmount: new BigNumber(100),
                takerFee: new BigNumber(100),
            });
            secondRemainingFillAmount = secondOrder.makerAssetAmount;
            ordersAndFillableAmounts = {
                orders: [firstOrder, secondOrder],
                remainingFillableMakerAssetAmounts: [firstRemainingFillAmount, secondRemainingFillAmount],
            };
            const smallFeeOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: new BigNumber(100),
                takerAssetAmount: new BigNumber(100),
            });
            smallFeeOrderAndFillableAmount = {
                orders: [smallFeeOrder],
                remainingFillableMakerAssetAmounts: [smallFeeOrder.makerAssetAmount],
            };
            const largeFeeOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: new BigNumber(113),
                takerAssetAmount: new BigNumber(200),
                takerFee: new BigNumber(11),
            });
            allFeeOrdersAndFillableAmounts = {
                orders: [smallFeeOrder, largeFeeOrder],
                remainingFillableMakerAssetAmounts: [
                    smallFeeOrder.makerAssetAmount,
                    largeFeeOrder.makerAssetAmount.minus(largeFeeOrder.takerFee),
                ],
            };
        });
        describe('InsufficientLiquidityError', () => {
            it('should throw if not enough taker asset liquidity (multiple orders)', () => {
                // we have 150 takerAsset units available to sell but attempt to calculate a quote for 200 takerAsset units
                const errorFunction = () => {
                    swapQuoteCalculator.calculateMarketSellSwapQuote(
                        ordersAndFillableAmounts,
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(200),
                        0,
                        false,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(150));
            });
            it('should throw if not enough taker asset liquidity (multiple orders with 20% slippage)', () => {
                // we have 150 takerAsset units available to sell but attempt to calculate a quote for 200 takerAsset units
                const errorFunction = () => {
                    swapQuoteCalculator.calculateMarketSellSwapQuote(
                        ordersAndFillableAmounts,
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(200),
                        0.2,
                        false,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(125));
            });
            it('should throw if not enough taker asset liquidity (multiple orders with 5% slippage)', () => {
                // we have 150 takerAsset units available to fill but attempt to calculate a quote for 200 takerAsset units
                const errorFunction = () => {
                    swapQuoteCalculator.calculateMarketSellSwapQuote(
                        ordersAndFillableAmounts,
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(200),
                        0.05,
                        false,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(142));
            });
            it('should throw if not enough taker asset liquidity (partially filled order)', () => {
                const firstOrderAndFillableAmount: OrdersAndFillableAmounts = {
                    orders: [firstOrder],
                    remainingFillableMakerAssetAmounts: [firstRemainingFillAmount],
                };

                const errorFunction = () => {
                    swapQuoteCalculator.calculateMarketSellSwapQuote(
                        firstOrderAndFillableAmount,
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(51),
                        0,
                        false,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(50));
            });
            it('should throw if not enough taker asset liquidity (completely fillable order)', () => {
                const completelyFillableOrder = orderFactory.createSignedOrderFromPartial({
                    makerAssetAmount: new BigNumber(123),
                    takerAssetAmount: new BigNumber(80),
                    takerFee: new BigNumber(200),
                });
                const completelyFillableOrdersAndFillableAmount: OrdersAndFillableAmounts = {
                    orders: [completelyFillableOrder],
                    remainingFillableMakerAssetAmounts: [completelyFillableOrder.makerAssetAmount],
                };
                const errorFunction = () => {
                    swapQuoteCalculator.calculateMarketSellSwapQuote(
                        completelyFillableOrdersAndFillableAmount,
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(81),
                        0,
                        false,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(80));
            });
            it('should throw with 1 amount available if no slippage', () => {
                const smallOrder = orderFactory.createSignedOrderFromPartial({
                    makerAssetAmount: new BigNumber(1),
                    takerAssetAmount: new BigNumber(1),
                    takerFee: new BigNumber(0),
                });
                const errorFunction = () => {
                    swapQuoteCalculator.calculateMarketSellSwapQuote(
                        { orders: [smallOrder], remainingFillableMakerAssetAmounts: [smallOrder.makerAssetAmount] },
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(100),
                        0,
                        false,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(1));
            });
            it('should throw with 0 available to fill if amount rounds to 0', () => {
                const smallOrder = orderFactory.createSignedOrderFromPartial({
                    makerAssetAmount: new BigNumber(1),
                    takerAssetAmount: new BigNumber(1),
                    takerFee: new BigNumber(0),
                });
                const errorFunction = () => {
                    swapQuoteCalculator.calculateMarketSellSwapQuote(
                        { orders: [smallOrder], remainingFillableMakerAssetAmounts: [smallOrder.makerAssetAmount] },
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(100),
                        0.2,
                        false,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(0));
            });
        });
        it('should not throw if order is fillable', () => {
            expect(() =>
                swapQuoteCalculator.calculateMarketSellSwapQuote(
                    ordersAndFillableAmounts,
                    allFeeOrdersAndFillableAmounts,
                    new BigNumber(125),
                    0,
                    false,
                    false,
                ),
            ).to.not.throw();
        });
        it('should throw if not enough ZRX liquidity', () => {
            // we request 75 takerAsset units but the ZRX order is only enough to fill the first order, which only has 50 takerAsset units available
            expect(() =>
                swapQuoteCalculator.calculateMarketSellSwapQuote(
                    ordersAndFillableAmounts,
                    smallFeeOrderAndFillableAmount,
                    new BigNumber(75),
                    0,
                    false,
                    false,
                ),
            ).to.throw(SwapQuoterError.InsufficientZrxLiquidity);
        });
        it('calculates a correct swapQuote with no slippage', () => {
            // we request 50 takerAsset units which can be filled using the first order
            // the first order requires a fee of 100 ZRX from the taker which can be filled by the feeOrder
            const assetSellAmount = new BigNumber(50);
            const slippagePercentage = 0;
            const swapQuote = swapQuoteCalculator.calculateMarketSellSwapQuote(
                ordersAndFillableAmounts,
                smallFeeOrderAndFillableAmount,
                assetSellAmount,
                slippagePercentage,
                false,
                false,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([ordersAndFillableAmounts.orders[0]]);
            expect(swapQuote.feeOrders).to.deep.equal([smallFeeOrderAndFillableAmount.orders[0]]);
            // test if rates are correct
            // 50 takerAsset units to fill the first order + 100 takerAsset units for fees
            const expectedMakerAssetAmountForTakerAsset = new BigNumber(200);
            const expectedTakerAssetAmountForZrxFees = new BigNumber(100);
            const expectedTotalTakerAssetAmount = assetSellAmount.plus(expectedTakerAssetAmountForZrxFees);
            expect(swapQuote.bestCaseQuoteInfo.takerTokenAmount).to.bignumber.equal(assetSellAmount);
            expect(swapQuote.bestCaseQuoteInfo.makerTokenAmount).to.bignumber.equal(
                expectedMakerAssetAmountForTakerAsset,
            );
            expect(swapQuote.bestCaseQuoteInfo.feeTakerTokenAmount).to.bignumber.equal(
                expectedTakerAssetAmountForZrxFees,
            );
            expect(swapQuote.bestCaseQuoteInfo.totalTakerTokenAmount).to.bignumber.equal(expectedTotalTakerAssetAmount);
            // because we have no slippage protection, minRate is equal to maxRate
            expect(swapQuote.worstCaseQuoteInfo.takerTokenAmount).to.bignumber.equal(assetSellAmount);
            expect(swapQuote.worstCaseQuoteInfo.makerTokenAmount).to.bignumber.equal(
                expectedMakerAssetAmountForTakerAsset,
            );
            expect(swapQuote.worstCaseQuoteInfo.feeTakerTokenAmount).to.bignumber.equal(
                expectedTakerAssetAmountForZrxFees,
            );
            expect(swapQuote.worstCaseQuoteInfo.totalTakerTokenAmount).to.bignumber.equal(
                expectedTotalTakerAssetAmount,
            );
        });
        it('calculates a correct swapQuote with slippage', () => {
            // we request 50 takerAsset units which can be filled using the first order
            // however with 50% slippage we are protecting the buy with 25 extra takerAssetUnits
            // so we need enough orders to fill 75 takerAssetUnits
            // 75 takerAssetUnits can only be filled using both orders
            // the first order requires a fee of 100 ZRX from the taker which can be filled by the feeOrder
            const assetSellAmount = new BigNumber(50);
            const slippagePercentage = 0.5;
            const swapQuote = swapQuoteCalculator.calculateMarketSellSwapQuote(
                ordersAndFillableAmounts,
                allFeeOrdersAndFillableAmounts,
                assetSellAmount,
                slippagePercentage,
                false,
                false,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal(ordersAndFillableAmounts.orders);
            expect(swapQuote.feeOrders).to.deep.equal(allFeeOrdersAndFillableAmounts.orders);
            // test if rates are correct
            const expectedMakerAssetAmountForTakerAsset = new BigNumber(200);
            const expectedTakerAssetAmountForZrxFees = new BigNumber(100);
            const expectedTotalTakerAssetAmount = assetSellAmount.plus(expectedTakerAssetAmountForZrxFees);
            expect(swapQuote.bestCaseQuoteInfo.takerTokenAmount).to.bignumber.equal(assetSellAmount);
            expect(swapQuote.bestCaseQuoteInfo.makerTokenAmount).to.bignumber.equal(
                expectedMakerAssetAmountForTakerAsset,
            );
            expect(swapQuote.bestCaseQuoteInfo.feeTakerTokenAmount).to.bignumber.equal(
                expectedTakerAssetAmountForZrxFees,
            );
            expect(swapQuote.bestCaseQuoteInfo.totalTakerTokenAmount).to.bignumber.equal(expectedTotalTakerAssetAmount);

            const expectedWorstMakerAssetAmountForTakerAsset = new BigNumber(100);
            const expectedWorstTakerAssetAmountForZrxFees = new BigNumber(99);
            const expectedWorstTotalTakerAssetAmount = assetSellAmount.plus(expectedWorstTakerAssetAmountForZrxFees);
            expect(swapQuote.worstCaseQuoteInfo.takerTokenAmount).to.bignumber.equal(assetSellAmount);
            expect(swapQuote.worstCaseQuoteInfo.makerTokenAmount).to.bignumber.equal(
                expectedWorstMakerAssetAmountForTakerAsset,
            );
            expect(swapQuote.worstCaseQuoteInfo.feeTakerTokenAmount).to.bignumber.equal(
                expectedWorstTakerAssetAmountForZrxFees,
            );
            expect(swapQuote.worstCaseQuoteInfo.totalTakerTokenAmount).to.bignumber.equal(
                expectedWorstTotalTakerAssetAmount,
            );
        });
        it('calculates a correct swapQuote (with fee calculations disabled) with no slippage', () => {
            // we request 50 takerAsset units which can be filled using the first order
            const assetSellAmount = new BigNumber(50);
            const slippagePercentage = 0;
            const swapQuote = swapQuoteCalculator.calculateMarketSellSwapQuote(
                ordersAndFillableAmounts,
                smallFeeOrderAndFillableAmount,
                assetSellAmount,
                slippagePercentage,
                false,
                true,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([ordersAndFillableAmounts.orders[0]]);
            expect(swapQuote.feeOrders).to.deep.equal([]);
            // test if rates are correct
            const expectedMakerAssetAmountForTakerAsset = new BigNumber(200);
            const expectedTotalTakerAssetAmount = assetSellAmount;
            expect(swapQuote.bestCaseQuoteInfo.takerTokenAmount).to.bignumber.equal(assetSellAmount);
            expect(swapQuote.bestCaseQuoteInfo.makerTokenAmount).to.bignumber.equal(
                expectedMakerAssetAmountForTakerAsset,
            );
            expect(swapQuote.bestCaseQuoteInfo.feeTakerTokenAmount).to.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(swapQuote.bestCaseQuoteInfo.totalTakerTokenAmount).to.bignumber.equal(expectedTotalTakerAssetAmount);
            // because we have no slippage protection, minRate is equal to maxRate
            expect(swapQuote.worstCaseQuoteInfo.takerTokenAmount).to.bignumber.equal(assetSellAmount);
            expect(swapQuote.worstCaseQuoteInfo.makerTokenAmount).to.bignumber.equal(
                expectedMakerAssetAmountForTakerAsset,
            );
            expect(swapQuote.worstCaseQuoteInfo.feeTakerTokenAmount).to.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(swapQuote.worstCaseQuoteInfo.totalTakerTokenAmount).to.bignumber.equal(
                expectedTotalTakerAssetAmount,
            );
        });
        it('calculates a correct swapQuote (with fee calculatations disabled) with slippage', () => {
            // we request 50 takerAsset units which can be filled using the first order
            // however with 50% slippage we are protecting the buy with 25 extra takerAssetUnits
            // so we need enough orders to fill 75 takerAssetUnits
            // 50 takerAssetUnits can only be filled using both orders
            // the first order requires a fee of 100 ZRX from the taker which can be filled by the feeOrder
            const assetSellAmount = new BigNumber(50);
            const slippagePercentage = 0.5;
            const swapQuote = swapQuoteCalculator.calculateMarketSellSwapQuote(
                ordersAndFillableAmounts,
                allFeeOrdersAndFillableAmounts,
                assetSellAmount,
                slippagePercentage,
                false,
                true,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal(ordersAndFillableAmounts.orders);
            expect(swapQuote.feeOrders).to.deep.equal([]);
            // test if rates are correct
            const expectedMakerAssetAmountForTakerAsset = new BigNumber(200);
            const expectedTotalTakerAssetAmount = assetSellAmount;
            expect(swapQuote.bestCaseQuoteInfo.takerTokenAmount).to.bignumber.equal(assetSellAmount);
            expect(swapQuote.bestCaseQuoteInfo.makerTokenAmount).to.bignumber.equal(
                expectedMakerAssetAmountForTakerAsset,
            );
            expect(swapQuote.bestCaseQuoteInfo.feeTakerTokenAmount).to.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(swapQuote.bestCaseQuoteInfo.totalTakerTokenAmount).to.bignumber.equal(expectedTotalTakerAssetAmount);
            // 100 eth to fill the first order + 208 eth for fees
            const expectedWorstMakerAssetAmountForTakerAsset = new BigNumber(100);
            const expectedWorstTotalTakerAssetAmount = assetSellAmount;
            expect(swapQuote.worstCaseQuoteInfo.takerTokenAmount).to.bignumber.equal(assetSellAmount);
            expect(swapQuote.worstCaseQuoteInfo.makerTokenAmount).to.bignumber.equal(
                expectedWorstMakerAssetAmountForTakerAsset,
            );
            expect(swapQuote.worstCaseQuoteInfo.feeTakerTokenAmount).to.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(swapQuote.worstCaseQuoteInfo.totalTakerTokenAmount).to.bignumber.equal(
                expectedWorstTotalTakerAssetAmount,
            );
        });
    });
    describe('#calculateMarketBuySwapQuote', () => {
        let firstOrder: SignedOrder;
        let firstRemainingFillAmount: BigNumber;
        let secondOrder: SignedOrder;
        let secondRemainingFillAmount: BigNumber;
        let ordersAndFillableAmounts: OrdersAndFillableAmounts;
        let smallFeeOrderAndFillableAmount: OrdersAndFillableAmounts;
        let allFeeOrdersAndFillableAmounts: OrdersAndFillableAmounts;
        beforeEach(() => {
            // generate two orders for our desired maker asset
            // the first order has a rate of 4 makerAsset / WETH with a takerFee of 200 ZRX and has only 200 / 400 makerAsset units left to fill (half fillable)
            // the second order has a rate of 2 makerAsset / WETH with a takerFee of 100 ZRX and has 200 / 200 makerAsset units left to fill (completely fillable)
            // generate one order for fees
            // the fee order has a rate of 1 ZRX / WETH with no taker fee and has 100 ZRX left to fill (completely fillable)
            firstOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: new BigNumber(400),
                takerAssetAmount: new BigNumber(100),
                takerFee: new BigNumber(200),
            });
            firstRemainingFillAmount = new BigNumber(200);
            secondOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: new BigNumber(200),
                takerAssetAmount: new BigNumber(100),
                takerFee: new BigNumber(100),
            });
            secondRemainingFillAmount = secondOrder.makerAssetAmount;
            ordersAndFillableAmounts = {
                orders: [firstOrder, secondOrder],
                remainingFillableMakerAssetAmounts: [firstRemainingFillAmount, secondRemainingFillAmount],
            };
            const smallFeeOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: new BigNumber(100),
                takerAssetAmount: new BigNumber(100),
            });
            smallFeeOrderAndFillableAmount = {
                orders: [smallFeeOrder],
                remainingFillableMakerAssetAmounts: [smallFeeOrder.makerAssetAmount],
            };
            const largeFeeOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: new BigNumber(113),
                takerAssetAmount: new BigNumber(200),
                takerFee: new BigNumber(11),
            });
            allFeeOrdersAndFillableAmounts = {
                orders: [smallFeeOrder, largeFeeOrder],
                remainingFillableMakerAssetAmounts: [
                    smallFeeOrder.makerAssetAmount,
                    largeFeeOrder.makerAssetAmount.minus(largeFeeOrder.takerFee),
                ],
            };
        });
        describe('InsufficientLiquidityError', () => {
            it('should throw if not enough maker asset liquidity (multiple orders)', () => {
                // we have 400 makerAsset units available to fill but attempt to calculate a quote for 500 makerAsset units
                const errorFunction = () => {
                    swapQuoteCalculator.calculateMarketBuySwapQuote(
                        ordersAndFillableAmounts,
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(500),
                        0,
                        false,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(400));
            });
            it('should throw if not enough maker asset liquidity (multiple orders with 20% slippage)', () => {
                // we have 400 makerAsset units available to fill but attempt to calculate a quote for 500 makerAsset units
                const errorFunction = () => {
                    swapQuoteCalculator.calculateMarketBuySwapQuote(
                        ordersAndFillableAmounts,
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(500),
                        0.2,
                        false,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(333));
            });
            it('should throw if not enough maker asset liquidity (multiple orders with 5% slippage)', () => {
                // we have 400 makerAsset units available to fill but attempt to calculate a quote for 500 makerAsset units
                const errorFunction = () => {
                    swapQuoteCalculator.calculateMarketBuySwapQuote(
                        ordersAndFillableAmounts,
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(600),
                        0.05,
                        false,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(380));
            });
            it('should throw if not enough maker asset liquidity (partially filled order)', () => {
                const firstOrderAndFillableAmount: OrdersAndFillableAmounts = {
                    orders: [firstOrder],
                    remainingFillableMakerAssetAmounts: [firstRemainingFillAmount],
                };

                const errorFunction = () => {
                    swapQuoteCalculator.calculateMarketBuySwapQuote(
                        firstOrderAndFillableAmount,
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(201),
                        0,
                        false,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(200));
            });
            it('should throw if not enough maker asset liquidity (completely fillable order)', () => {
                const completelyFillableOrder = orderFactory.createSignedOrderFromPartial({
                    makerAssetAmount: new BigNumber(123),
                    takerAssetAmount: new BigNumber(100),
                    takerFee: new BigNumber(200),
                });
                const completelyFillableOrdersAndFillableAmount: OrdersAndFillableAmounts = {
                    orders: [completelyFillableOrder],
                    remainingFillableMakerAssetAmounts: [completelyFillableOrder.makerAssetAmount],
                };
                const errorFunction = () => {
                    swapQuoteCalculator.calculateMarketBuySwapQuote(
                        completelyFillableOrdersAndFillableAmount,
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(124),
                        0,
                        false,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(123));
            });
            it('should throw with 1 amount available if no slippage', () => {
                const smallOrder = orderFactory.createSignedOrderFromPartial({
                    makerAssetAmount: new BigNumber(1),
                    takerAssetAmount: new BigNumber(1),
                    takerFee: new BigNumber(0),
                });
                const errorFunction = () => {
                    swapQuoteCalculator.calculateMarketBuySwapQuote(
                        { orders: [smallOrder], remainingFillableMakerAssetAmounts: [smallOrder.makerAssetAmount] },
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(600),
                        0,
                        false,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(1));
            });
            it('should throw with 0 available to fill if amount rounds to 0', () => {
                const smallOrder = orderFactory.createSignedOrderFromPartial({
                    makerAssetAmount: new BigNumber(1),
                    takerAssetAmount: new BigNumber(1),
                    takerFee: new BigNumber(0),
                });
                const errorFunction = () => {
                    swapQuoteCalculator.calculateMarketBuySwapQuote(
                        { orders: [smallOrder], remainingFillableMakerAssetAmounts: [smallOrder.makerAssetAmount] },
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(600),
                        0.2,
                        false,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(0));
            });
        });
        it('should not throw if order is fillable', () => {
            expect(() =>
                swapQuoteCalculator.calculateMarketBuySwapQuote(
                    ordersAndFillableAmounts,
                    allFeeOrdersAndFillableAmounts,
                    new BigNumber(300),
                    0,
                    false,
                    false,
                ),
            ).to.not.throw();
        });
        it('should throw if not enough ZRX liquidity', () => {
            // we request 300 makerAsset units but the ZRX order is only enough to fill the first order, which only has 200 makerAssetUnits available
            expect(() =>
                swapQuoteCalculator.calculateMarketBuySwapQuote(
                    ordersAndFillableAmounts,
                    smallFeeOrderAndFillableAmount,
                    new BigNumber(300),
                    0,
                    false,
                    false,
                ),
            ).to.throw(SwapQuoterError.InsufficientZrxLiquidity);
        });
        it('calculates a correct swapQuote with no slippage', () => {
            // we request 200 makerAsset units which can be filled using the first order
            // the first order requires a fee of 100 ZRX from the taker which can be filled by the feeOrder
            const assetBuyAmount = new BigNumber(200);
            const slippagePercentage = 0;
            const swapQuote = swapQuoteCalculator.calculateMarketBuySwapQuote(
                ordersAndFillableAmounts,
                smallFeeOrderAndFillableAmount,
                assetBuyAmount,
                slippagePercentage,
                false,
                false,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([ordersAndFillableAmounts.orders[0]]);
            expect(swapQuote.feeOrders).to.deep.equal([smallFeeOrderAndFillableAmount.orders[0]]);
            // test if rates are correct
            // 50 eth to fill the first order + 100 eth for fees
            const expectedTakerAssetAmountForMakerAsset = new BigNumber(50);
            const expectedTakerAssetAmountForZrxFees = new BigNumber(100);
            const expectedTotalTakerAssetAmount = expectedTakerAssetAmountForMakerAsset.plus(
                expectedTakerAssetAmountForZrxFees,
            );
            expect(swapQuote.bestCaseQuoteInfo.takerTokenAmount).to.bignumber.equal(
                expectedTakerAssetAmountForMakerAsset,
            );
            expect(swapQuote.bestCaseQuoteInfo.feeTakerTokenAmount).to.bignumber.equal(
                expectedTakerAssetAmountForZrxFees,
            );
            expect(swapQuote.bestCaseQuoteInfo.totalTakerTokenAmount).to.bignumber.equal(expectedTotalTakerAssetAmount);
            // because we have no slippage protection, minRate is equal to maxRate
            expect(swapQuote.worstCaseQuoteInfo.takerTokenAmount).to.bignumber.equal(
                expectedTakerAssetAmountForMakerAsset,
            );
            expect(swapQuote.worstCaseQuoteInfo.feeTakerTokenAmount).to.bignumber.equal(
                expectedTakerAssetAmountForZrxFees,
            );
            expect(swapQuote.worstCaseQuoteInfo.totalTakerTokenAmount).to.bignumber.equal(
                expectedTotalTakerAssetAmount,
            );
        });
        it('calculates a correct swapQuote with slippage', () => {
            // we request 200 makerAsset units which can be filled using the first order
            // however with 50% slippage we are protecting the buy with 100 extra makerAssetUnits
            // so we need enough orders to fill 300 makerAssetUnits
            // 300 makerAssetUnits can only be filled using both orders
            // the first order requires a fee of 100 ZRX from the taker which can be filled by the feeOrder
            const assetBuyAmount = new BigNumber(200);
            const slippagePercentage = 0.5;
            const swapQuote = swapQuoteCalculator.calculateMarketBuySwapQuote(
                ordersAndFillableAmounts,
                allFeeOrdersAndFillableAmounts,
                assetBuyAmount,
                slippagePercentage,
                false,
                false,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal(ordersAndFillableAmounts.orders);
            expect(swapQuote.feeOrders).to.deep.equal(allFeeOrdersAndFillableAmounts.orders);
            // test if rates are correct
            // 50 eth to fill the first order + 100 eth for fees
            const expectedTakerAssetAmountForMakerAsset = new BigNumber(50);
            const expectedTakerAssetAmountForZrxFees = new BigNumber(100);
            const expectedTotalTakerAssetAmount = expectedTakerAssetAmountForMakerAsset.plus(
                expectedTakerAssetAmountForZrxFees,
            );
            expect(swapQuote.bestCaseQuoteInfo.takerTokenAmount).to.bignumber.equal(
                expectedTakerAssetAmountForMakerAsset,
            );
            expect(swapQuote.bestCaseQuoteInfo.feeTakerTokenAmount).to.bignumber.equal(
                expectedTakerAssetAmountForZrxFees,
            );
            expect(swapQuote.bestCaseQuoteInfo.totalTakerTokenAmount).to.bignumber.equal(expectedTotalTakerAssetAmount);
            // 100 eth to fill the first order + 208 eth for fees
            const expectedWorstTakerAssetAmountForMakerAsset = new BigNumber(100);
            const expectedWorstTakerAssetAmountForZrxFees = new BigNumber(208);
            const expectedWorstTotalTakerAssetAmount = expectedWorstTakerAssetAmountForMakerAsset.plus(
                expectedWorstTakerAssetAmountForZrxFees,
            );
            expect(swapQuote.worstCaseQuoteInfo.takerTokenAmount).to.bignumber.equal(
                expectedWorstTakerAssetAmountForMakerAsset,
            );
            expect(swapQuote.worstCaseQuoteInfo.feeTakerTokenAmount).to.bignumber.equal(
                expectedWorstTakerAssetAmountForZrxFees,
            );
            expect(swapQuote.worstCaseQuoteInfo.totalTakerTokenAmount).to.bignumber.equal(
                expectedWorstTotalTakerAssetAmount,
            );
        });
        it('calculates a correct swapQuote (with fee calculations disabled) with no slippage', () => {
            // we request 200 makerAsset units which can be filled using the first order
            // the first order requires a fee of 100 ZRX from the taker which can be filled by the feeOrder
            const assetBuyAmount = new BigNumber(200);
            const slippagePercentage = 0;
            const swapQuote = swapQuoteCalculator.calculateMarketBuySwapQuote(
                ordersAndFillableAmounts,
                smallFeeOrderAndFillableAmount,
                assetBuyAmount,
                slippagePercentage,
                false,
                true,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([ordersAndFillableAmounts.orders[0]]);
            expect(swapQuote.feeOrders).to.deep.equal([]);
            // test if rates are correct
            // 50 eth to fill the first order + 100 eth for fees
            const expectedTakerAssetAmountForMakerAsset = new BigNumber(50);
            const expectedTotalTakerAssetAmount = expectedTakerAssetAmountForMakerAsset;
            expect(swapQuote.bestCaseQuoteInfo.takerTokenAmount).to.bignumber.equal(
                expectedTakerAssetAmountForMakerAsset,
            );
            expect(swapQuote.bestCaseQuoteInfo.feeTakerTokenAmount).to.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(swapQuote.bestCaseQuoteInfo.totalTakerTokenAmount).to.bignumber.equal(expectedTotalTakerAssetAmount);
            // because we have no slippage protection, minRate is equal to maxRate
            expect(swapQuote.worstCaseQuoteInfo.takerTokenAmount).to.bignumber.equal(
                expectedTakerAssetAmountForMakerAsset,
            );
            expect(swapQuote.worstCaseQuoteInfo.feeTakerTokenAmount).to.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(swapQuote.worstCaseQuoteInfo.totalTakerTokenAmount).to.bignumber.equal(
                expectedTotalTakerAssetAmount,
            );
        });
        it('calculates a correct swapQuote (with fee calculations disabled) with slippage', () => {
            // we request 200 makerAsset units which can be filled using the first order
            // however with 50% slippage we are protecting the buy with 100 extra makerAssetUnits
            // so we need enough orders to fill 300 makerAssetUnits
            // 300 makerAssetUnits can only be filled using both orders
            // the first order requires a fee of 100 ZRX from the taker which can be filled by the feeOrder
            const assetBuyAmount = new BigNumber(200);
            const slippagePercentage = 0.5;
            const swapQuote = swapQuoteCalculator.calculateMarketBuySwapQuote(
                ordersAndFillableAmounts,
                allFeeOrdersAndFillableAmounts,
                assetBuyAmount,
                slippagePercentage,
                false,
                true,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal(ordersAndFillableAmounts.orders);
            expect(swapQuote.feeOrders).to.deep.equal([]);
            // test if rates are correct
            // 50 eth to fill the first order + 100 eth for fees
            const expectedTakerAssetAmountForMakerAsset = new BigNumber(50);
            const expectedTotalTakerAssetAmount = expectedTakerAssetAmountForMakerAsset;
            expect(swapQuote.bestCaseQuoteInfo.takerTokenAmount).to.bignumber.equal(
                expectedTakerAssetAmountForMakerAsset,
            );
            expect(swapQuote.bestCaseQuoteInfo.feeTakerTokenAmount).to.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(swapQuote.bestCaseQuoteInfo.totalTakerTokenAmount).to.bignumber.equal(expectedTotalTakerAssetAmount);
            // 100 eth to fill the first order + 208 eth for fees
            const expectedWorstTakerAssetAmountForMakerAsset = new BigNumber(100);
            const expectedWorstTotalTakerAssetAmount = expectedWorstTakerAssetAmountForMakerAsset;
            expect(swapQuote.worstCaseQuoteInfo.takerTokenAmount).to.bignumber.equal(
                expectedWorstTakerAssetAmountForMakerAsset,
            );
            expect(swapQuote.worstCaseQuoteInfo.feeTakerTokenAmount).to.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(swapQuote.worstCaseQuoteInfo.totalTakerTokenAmount).to.bignumber.equal(
                expectedWorstTotalTakerAssetAmount,
            );
        });
    });
});
