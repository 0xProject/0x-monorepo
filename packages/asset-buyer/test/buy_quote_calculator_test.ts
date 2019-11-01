import { orderFactory } from '@0x/order-utils/lib/src/order_factory';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import { AssetBuyerError, OrdersAndFillableAmounts } from '../src/types';
import { buyQuoteCalculator } from '../src/utils/buy_quote_calculator';

import { chaiSetup } from './utils/chai_setup';
import { testHelpers } from './utils/test_helpers';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('buyQuoteCalculator', () => {
    describe('#calculate', () => {
        let firstOrder: SignedOrder;
        let firstRemainingFillAmount: BigNumber;
        let secondOrder: SignedOrder;
        let secondRemainingFillAmount: BigNumber;
        let ordersAndFillableAmounts: OrdersAndFillableAmounts;
        let smallFeeOrderAndFillableAmount: OrdersAndFillableAmounts;
        let allFeeOrdersAndFillableAmounts: OrdersAndFillableAmounts;
        const chainId = 1;
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
                chainId,
            });
            firstRemainingFillAmount = new BigNumber(200);
            secondOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: new BigNumber(200),
                takerAssetAmount: new BigNumber(100),
                takerFee: new BigNumber(100),
                chainId,
            });
            secondRemainingFillAmount = secondOrder.makerAssetAmount;
            ordersAndFillableAmounts = {
                orders: [firstOrder, secondOrder],
                remainingFillableMakerAssetAmounts: [firstRemainingFillAmount, secondRemainingFillAmount],
            };
            const smallFeeOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: new BigNumber(100),
                takerAssetAmount: new BigNumber(100),
                chainId,
            });
            smallFeeOrderAndFillableAmount = {
                orders: [smallFeeOrder],
                remainingFillableMakerAssetAmounts: [smallFeeOrder.makerAssetAmount],
            };
            const largeFeeOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: new BigNumber(113),
                takerAssetAmount: new BigNumber(200),
                takerFee: new BigNumber(11),
                chainId,
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
                    buyQuoteCalculator.calculate(
                        ordersAndFillableAmounts,
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(500),
                        0,
                        0,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(400));
            });
            it('should throw if not enough maker asset liquidity (multiple orders with 20% slippage)', () => {
                // we have 400 makerAsset units available to fill but attempt to calculate a quote for 500 makerAsset units
                const errorFunction = () => {
                    buyQuoteCalculator.calculate(
                        ordersAndFillableAmounts,
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(500),
                        0,
                        0.2,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(333));
            });
            it('should throw if not enough maker asset liquidity (multiple orders with 5% slippage)', () => {
                // we have 400 makerAsset units available to fill but attempt to calculate a quote for 500 makerAsset units
                const errorFunction = () => {
                    buyQuoteCalculator.calculate(
                        ordersAndFillableAmounts,
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(600),
                        0,
                        0.05,
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
                    buyQuoteCalculator.calculate(
                        firstOrderAndFillableAmount,
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(201),
                        0,
                        0,
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
                    chainId,
                });
                const completelyFillableOrdersAndFillableAmount: OrdersAndFillableAmounts = {
                    orders: [completelyFillableOrder],
                    remainingFillableMakerAssetAmounts: [completelyFillableOrder.makerAssetAmount],
                };
                const errorFunction = () => {
                    buyQuoteCalculator.calculate(
                        completelyFillableOrdersAndFillableAmount,
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(124),
                        0,
                        0,
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
                    chainId,
                });
                const errorFunction = () => {
                    buyQuoteCalculator.calculate(
                        { orders: [smallOrder], remainingFillableMakerAssetAmounts: [smallOrder.makerAssetAmount] },
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(600),
                        0,
                        0,
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
                    chainId,
                });
                const errorFunction = () => {
                    buyQuoteCalculator.calculate(
                        { orders: [smallOrder], remainingFillableMakerAssetAmounts: [smallOrder.makerAssetAmount] },
                        smallFeeOrderAndFillableAmount,
                        new BigNumber(600),
                        0,
                        0.2,
                        false,
                    );
                };
                testHelpers.expectInsufficientLiquidityError(expect, errorFunction, new BigNumber(0));
            });
        });
        it('should not throw if order is fillable', () => {
            expect(() =>
                buyQuoteCalculator.calculate(
                    ordersAndFillableAmounts,
                    allFeeOrdersAndFillableAmounts,
                    new BigNumber(300),
                    0,
                    0,
                    false,
                ),
            ).to.not.throw();
        });
        it('should throw if not enough ZRX liquidity', () => {
            // we request 300 makerAsset units but the ZRX order is only enough to fill the first order, which only has 200 makerAssetUnits available
            expect(() =>
                buyQuoteCalculator.calculate(
                    ordersAndFillableAmounts,
                    smallFeeOrderAndFillableAmount,
                    new BigNumber(300),
                    0,
                    0,
                    false,
                ),
            ).to.throw(AssetBuyerError.InsufficientZrxLiquidity);
        });
        it('calculates a correct buyQuote with no slippage', () => {
            // we request 200 makerAsset units which can be filled using the first order
            // the first order requires a fee of 100 ZRX from the taker which can be filled by the feeOrder
            const assetBuyAmount = new BigNumber(200);
            const feePercentage = 0.02;
            const slippagePercentage = 0;
            const buyQuote = buyQuoteCalculator.calculate(
                ordersAndFillableAmounts,
                smallFeeOrderAndFillableAmount,
                assetBuyAmount,
                feePercentage,
                slippagePercentage,
                false,
            );
            // test if orders are correct
            expect(buyQuote.orders).to.deep.equal([ordersAndFillableAmounts.orders[0]]);
            expect(buyQuote.feeOrders).to.deep.equal([smallFeeOrderAndFillableAmount.orders[0]]);
            // test if rates are correct
            // 50 eth to fill the first order + 100 eth for fees
            const expectedEthAmountForAsset = new BigNumber(50);
            const expectedEthAmountForZrxFees = new BigNumber(100);
            const expectedFillEthAmount = expectedEthAmountForAsset;
            const expectedAffiliateFeeEthAmount = expectedEthAmountForAsset.multipliedBy(feePercentage);
            const expectedFeeEthAmount = expectedAffiliateFeeEthAmount.plus(expectedEthAmountForZrxFees);
            const expectedTotalEthAmount = expectedFillEthAmount.plus(expectedFeeEthAmount);
            expect(buyQuote.bestCaseQuoteInfo.assetEthAmount).to.bignumber.equal(expectedFillEthAmount);
            expect(buyQuote.bestCaseQuoteInfo.feeEthAmount).to.bignumber.equal(expectedFeeEthAmount);
            expect(buyQuote.bestCaseQuoteInfo.totalEthAmount).to.bignumber.equal(expectedTotalEthAmount);
            // because we have no slippage protection, minRate is equal to maxRate
            expect(buyQuote.worstCaseQuoteInfo.assetEthAmount).to.bignumber.equal(expectedFillEthAmount);
            expect(buyQuote.worstCaseQuoteInfo.feeEthAmount).to.bignumber.equal(expectedFeeEthAmount);
            expect(buyQuote.worstCaseQuoteInfo.totalEthAmount).to.bignumber.equal(expectedTotalEthAmount);
            // test if feePercentage gets passed through
            expect(buyQuote.feePercentage).to.equal(feePercentage);
        });
        it('calculates a correct buyQuote with with slippage', () => {
            // we request 200 makerAsset units which can be filled using the first order
            // however with 50% slippage we are protecting the buy with 100 extra makerAssetUnits
            // so we need enough orders to fill 300 makerAssetUnits
            // 300 makerAssetUnits can only be filled using both orders
            // the first order requires a fee of 100 ZRX from the taker which can be filled by the feeOrder
            const assetBuyAmount = new BigNumber(200);
            const feePercentage = 0.02;
            const slippagePercentage = 0.5;
            const buyQuote = buyQuoteCalculator.calculate(
                ordersAndFillableAmounts,
                allFeeOrdersAndFillableAmounts,
                assetBuyAmount,
                feePercentage,
                slippagePercentage,
                false,
            );
            // test if orders are correct
            expect(buyQuote.orders).to.deep.equal(ordersAndFillableAmounts.orders);
            expect(buyQuote.feeOrders).to.deep.equal(allFeeOrdersAndFillableAmounts.orders);
            // test if rates are correct
            // 50 eth to fill the first order + 100 eth for fees
            const expectedEthAmountForAsset = new BigNumber(50);
            const expectedEthAmountForZrxFees = new BigNumber(100);
            const expectedFillEthAmount = expectedEthAmountForAsset;
            const expectedAffiliateFeeEthAmount = expectedEthAmountForAsset.multipliedBy(feePercentage);
            const expectedFeeEthAmount = expectedAffiliateFeeEthAmount.plus(expectedEthAmountForZrxFees);
            const expectedTotalEthAmount = expectedFillEthAmount.plus(expectedFeeEthAmount);
            expect(buyQuote.bestCaseQuoteInfo.assetEthAmount).to.bignumber.equal(expectedFillEthAmount);
            expect(buyQuote.bestCaseQuoteInfo.feeEthAmount).to.bignumber.equal(expectedFeeEthAmount);
            expect(buyQuote.bestCaseQuoteInfo.totalEthAmount).to.bignumber.equal(expectedTotalEthAmount);
            // 100 eth to fill the first order + 208 eth for fees
            const expectedWorstEthAmountForAsset = new BigNumber(100);
            const expectedWorstEthAmountForZrxFees = new BigNumber(208);
            const expectedWorstFillEthAmount = expectedWorstEthAmountForAsset;
            const expectedWorstAffiliateFeeEthAmount = expectedWorstEthAmountForAsset.multipliedBy(feePercentage);
            const expectedWorstFeeEthAmount = expectedWorstAffiliateFeeEthAmount.plus(expectedWorstEthAmountForZrxFees);
            const expectedWorstTotalEthAmount = expectedWorstFillEthAmount.plus(expectedWorstFeeEthAmount);
            expect(buyQuote.worstCaseQuoteInfo.assetEthAmount).to.bignumber.equal(expectedWorstFillEthAmount);
            expect(buyQuote.worstCaseQuoteInfo.feeEthAmount).to.bignumber.equal(expectedWorstFeeEthAmount);
            expect(buyQuote.worstCaseQuoteInfo.totalEthAmount).to.bignumber.equal(expectedWorstTotalEthAmount);
            // test if feePercentage gets passed through
            expect(buyQuote.feePercentage).to.equal(feePercentage);
        });
    });
});
