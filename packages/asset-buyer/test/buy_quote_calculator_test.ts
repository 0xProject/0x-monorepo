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

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const NULL_BYTES = '0x';

// tslint:disable:custom-no-magic-numbers
describe('buyQuoteCalculator', () => {
    describe('#calculate', () => {
        let ordersAndFillableAmounts: OrdersAndFillableAmounts;
        let feeOrdersAndFillableAmounts: OrdersAndFillableAmounts;
        beforeEach(() => {
            // generate two orders for our desired maker asset
            // the first order has a rate of 4 makerAsset / WETH with a takerFee of 200 ZRX and has only 200 / 400 makerAsset units left to fill (half fillable)
            // the second order has a rate of 2 makerAsset / WETH with a takerFee of 100 ZRX and has 200 / 200 makerAsset units left to fill (completely fillable)
            // generate one order for fees
            // the fee order has a rate of 1 ZRX / WETH with no taker fee and has 100 ZRX left to fill (completely fillable)
            const firstOrder = orderFactory.createOrder(
                NULL_ADDRESS,
                new BigNumber(400),
                NULL_BYTES,
                new BigNumber(100),
                NULL_BYTES,
                NULL_ADDRESS,
                {
                    takerFee: new BigNumber(200),
                },
            );
            const firstRemainingFillAmount = new BigNumber(200);
            const secondOrder = orderFactory.createOrder(
                NULL_ADDRESS,
                new BigNumber(200),
                NULL_BYTES,
                new BigNumber(100),
                NULL_BYTES,
                NULL_ADDRESS,
                {
                    takerFee: new BigNumber(100),
                },
            );
            const secondRemainingFillAmount = secondOrder.makerAssetAmount;
            const signedOrders = _.map([firstOrder, secondOrder], order => {
                return {
                    ...order,
                    signature: NULL_BYTES,
                };
            });
            ordersAndFillableAmounts = {
                orders: signedOrders,
                remainingFillableMakerAssetAmounts: [firstRemainingFillAmount, secondRemainingFillAmount],
            };
            const feeOrder = orderFactory.createOrder(
                NULL_ADDRESS,
                new BigNumber(100),
                NULL_BYTES,
                new BigNumber(100),
                NULL_BYTES,
                NULL_ADDRESS,
            );
            const signedFeeOrder = {
                ...feeOrder,
                signature: NULL_BYTES,
            };
            feeOrdersAndFillableAmounts = {
                orders: [signedFeeOrder],
                remainingFillableMakerAssetAmounts: [signedFeeOrder.makerAssetAmount],
            };
        });
        it('should throw if not enough maker asset liquidity', () => {
            // we have 400 makerAsset units available to fill but attempt to calculate a quote for 500 makerAsset units
            expect(() =>
                buyQuoteCalculator.calculate(
                    ordersAndFillableAmounts,
                    feeOrdersAndFillableAmounts,
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
                    feeOrdersAndFillableAmounts,
                    new BigNumber(300),
                    0,
                    0,
                ),
            ).to.throw(AssetBuyerError.InsufficientZrxLiquidity);
        });
        it('calculates a correct buyQuote', () => {
            // we request 200 makerAsset units which can be filled using the first order
            // the first order requires a fee of 100 ZRX from the taker which can be filled by the feeOrder
            const assetBuyAmount = new BigNumber(200);
            const feePercentage = 0.02;
            const slippagePercentage = 0;
            const buyQuote = buyQuoteCalculator.calculate(
                ordersAndFillableAmounts,
                feeOrdersAndFillableAmounts,
                assetBuyAmount,
                feePercentage,
                slippagePercentage,
            );
            // test if orders are correct
            expect(buyQuote.orders).to.deep.equal([ordersAndFillableAmounts.orders[0]]);
            expect(buyQuote.feeOrders).to.deep.equal([feeOrdersAndFillableAmounts.orders[0]]);
            // test if rates are correct
            const expectedMinEthToFill = new BigNumber(150);
            const expectedMinRate = assetBuyAmount.div(expectedMinEthToFill.mul(feePercentage + 1));
            expect(buyQuote.minRate).to.bignumber.equal(expectedMinRate);
            // because we have no slippage protection, minRate is equal to maxRate
            expect(buyQuote.maxRate).to.bignumber.equal(expectedMinRate);
            // test if feePercentage gets passed through
            expect(buyQuote.feePercentage).to.equal(feePercentage);
        });
    });
});
