import { orderFactory } from '@0xproject/order-utils/lib/src/order_factory';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import { AssetBuyerError, OrdersAndFillableAmounts } from '../src/types';
import { buyQuoteCalculator } from '../src/utils/buy_quote_calculator';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('buyQuoteCalculator', () => {
    describe('#calculate', () => {
        let ordersAndFillableAmounts: OrdersAndFillableAmounts;
        let smallFeeOrderAndFillableAmount: OrdersAndFillableAmounts;
        let allFeeOrdersAndFillableAmounts: OrdersAndFillableAmounts;
        beforeEach(() => {
            // generate two orders for our desired maker asset
            // the first order has a rate of 4 makerAsset / WETH with a takerFee of 200 ZRX and has only 200 / 400 makerAsset units left to fill (half fillable)
            // the second order has a rate of 2 makerAsset / WETH with a takerFee of 100 ZRX and has 200 / 200 makerAsset units left to fill (completely fillable)
            // generate one order for fees
            // the fee order has a rate of 1 ZRX / WETH with no taker fee and has 100 ZRX left to fill (completely fillable)
            const firstOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: new BigNumber(400),
                takerAssetAmount: new BigNumber(100),
                takerFee: new BigNumber(200),
            });
            const firstRemainingFillAmount = new BigNumber(200);
            const secondOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: new BigNumber(200),
                takerAssetAmount: new BigNumber(100),
                takerFee: new BigNumber(100),
            });
            const secondRemainingFillAmount = secondOrder.makerAssetAmount;
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
                makerAssetAmount: new BigNumber(110),
                takerAssetAmount: new BigNumber(200),
                takerFee: new BigNumber(10),
            });
            allFeeOrdersAndFillableAmounts = {
                orders: [smallFeeOrder, largeFeeOrder],
                remainingFillableMakerAssetAmounts: [
                    smallFeeOrder.makerAssetAmount,
                    largeFeeOrder.makerAssetAmount.minus(largeFeeOrder.takerFee),
                ],
            };
        });
        it('should throw if not enough maker asset liquidity', () => {
            // we have 400 makerAsset units available to fill but attempt to calculate a quote for 500 makerAsset units
            expect(() =>
                buyQuoteCalculator.calculate(
                    ordersAndFillableAmounts,
                    smallFeeOrderAndFillableAmount,
                    new BigNumber(500),
                    0,
                    0,
                ),
            ).to.throw(AssetBuyerError.InsufficientAssetLiquidity);
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
            );
            // test if orders are correct
            expect(buyQuote.orders).to.deep.equal([ordersAndFillableAmounts.orders[0]]);
            expect(buyQuote.feeOrders).to.deep.equal([smallFeeOrderAndFillableAmount.orders[0]]);
            // test if rates are correct
            // 50 eth to fill the first order + 100 eth for fees
            const expectedMinEthToFill = new BigNumber(150);
            const expectedMinRate = assetBuyAmount.div(expectedMinEthToFill.mul(feePercentage + 1));
            expect(buyQuote.minRate).to.bignumber.equal(expectedMinRate);
            // because we have no slippage protection, minRate is equal to maxRate
            expect(buyQuote.maxRate).to.bignumber.equal(expectedMinRate);
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
            );
            // test if orders are correct
            expect(buyQuote.orders).to.deep.equal(ordersAndFillableAmounts.orders);
            expect(buyQuote.feeOrders).to.deep.equal(allFeeOrdersAndFillableAmounts.orders);
            // test if rates are correct
            // 50 eth to fill the first order + 100 eth for fees
            const expectedMinEthToFill = new BigNumber(150);
            const expectedMinRate = assetBuyAmount.div(expectedMinEthToFill.mul(feePercentage + 1));
            expect(buyQuote.minRate).to.bignumber.equal(expectedMinRate);
            // 100 eth to fill the first order + 200 eth for fees
            const expectedMaxEthToFill = new BigNumber(300);
            const expectedMaxRate = assetBuyAmount.div(expectedMaxEthToFill.mul(feePercentage + 1));
            expect(buyQuote.maxRate).to.bignumber.equal(expectedMaxRate);
            // test if feePercentage gets passed through
            expect(buyQuote.feePercentage).to.equal(feePercentage);
        });
    });
});
