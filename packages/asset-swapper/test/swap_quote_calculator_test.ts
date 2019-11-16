import { constants as devConstants } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';
import * as TypeMoq from 'typemoq';

import { ProtocolFeeUtils } from '../src/utils/protocol_fee_utils';
import { swapQuoteCalculator } from '../src/utils/swap_quote_calculator';

import { chaiSetup } from './utils/chai_setup';
import { protocolFeeUtilsMock } from './utils/mocks';
import { testHelpers } from './utils/test_helpers';
import { testOrders } from './utils/test_orders';
import { baseUnitAmount } from './utils/utils';

chaiSetup.configure();
const expect = chai.expect;

const GAS_PRICE = new BigNumber(devConstants.DEFAULT_GAS_PRICE);
const ONE_ETH_IN_WEI = new BigNumber(1000000000000000000);
const MIXED_TEST_ORDERS = _.concat(
    testOrders.PRUNED_SIGNED_ORDERS_FEELESS,
    testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET,
    testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET,
);

// tslint:disable:max-file-line-count
// tslint:disable:custom-no-magic-numbers
describe('swapQuoteCalculator', () => {
    let mockProtocolFeeUtils: TypeMoq.IMock<ProtocolFeeUtils>;

    before(async () => {
        mockProtocolFeeUtils = protocolFeeUtilsMock();
    });

    describe('#calculateMarketSellSwapQuote', () => {
        describe('InsufficientLiquidityError', () => {
            it('should throw if not enough taker asset liquidity (multiple feeless orders)', async () => {
                const errorFunction = async () => {
                    await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                        testOrders.PRUNED_SIGNED_ORDERS_FEELESS,
                        baseUnitAmount(10),
                        0,
                        GAS_PRICE,
                        mockProtocolFeeUtils.object,
                    );
                };
                await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(9));
            });
            it('should throw if not enough taker asset liquidity (multiple feeless orders with 20% slippage)',async () => {
                const errorFunction = async () => {
                    await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                        testOrders.PRUNED_SIGNED_ORDERS_FEELESS,
                        baseUnitAmount(10),
                        0.2,
                        GAS_PRICE,
                        mockProtocolFeeUtils.object,
                    );
                };
                await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(7.5));
            });
            it('should throw if not enough taker asset liquidity (multiple takerAsset denominated fee orders with no slippage)', async () => {
                const errorFunction = async () => {
                    await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                        testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET,
                        baseUnitAmount(20),
                        0,
                        GAS_PRICE,
                        mockProtocolFeeUtils.object,
                    );
                };
                await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(15));
            });
            it('should throw if not enough taker asset liquidity (multiple takerAsset denominated fee orders with 20% slippage)', async () => {
                const errorFunction = async () => {
                    await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                        testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET,
                        baseUnitAmount(20),
                        0.2,
                        GAS_PRICE,
                        mockProtocolFeeUtils.object,
                    );
                };
                await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(12.5));
            });
            it('should throw if not enough taker asset liquidity (multiple makerAsset denominated fee orders with no slippage)', async () => {
                const errorFunction = async () => {
                    await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                        testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET,
                        baseUnitAmount(10),
                        0,
                        GAS_PRICE,
                        mockProtocolFeeUtils.object,
                    );
                };
                await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(9));
            });
            it('should throw if not enough taker asset liquidity (multiple makerAsset denominated fee orders with 20% slippage)', async () => {
                const errorFunction = async () => {
                    await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                        testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET,
                        baseUnitAmount(10),
                        0.2,
                        GAS_PRICE,
                        mockProtocolFeeUtils.object,
                    );
                };
                await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(7.5));
            });
            it('should throw if not enough taker asset liquidity (multiple mixed feeType orders with no slippage)', async () => {
                const errorFunction = async () => {
                    await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                        MIXED_TEST_ORDERS,
                        baseUnitAmount(40),
                        0,
                        GAS_PRICE,
                        mockProtocolFeeUtils.object,
                    );
                };
                await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(33));
            });
            it('should throw if not enough taker asset liquidity (multiple mixed feeTyoe orders with 20% slippage)', async () => {
                const errorFunction = async () => {
                    await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                        MIXED_TEST_ORDERS,
                        baseUnitAmount(40),
                        0.2,
                        GAS_PRICE,
                        mockProtocolFeeUtils.object,
                    );
                };
                await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(27.5));
            });
        });
        it('calculates a correct swapQuote with no slippage (feeless orders)', async () => {
            const assetSellAmount = baseUnitAmount(0.5);
            const slippagePercentage = 0;
            const swapQuote = await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                testOrders.PRUNED_SIGNED_ORDERS_FEELESS,
                assetSellAmount,
                slippagePercentage,
                GAS_PRICE,
                mockProtocolFeeUtils.object,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([testOrders.PRUNED_SIGNED_ORDERS_FEELESS[0]]);
            expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0),
                takerAssetAmount: assetSellAmount,
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(3),
                protocolFeeInEthAmount: baseUnitAmount(15, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0),
                takerAssetAmount: assetSellAmount,
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(3),
                protocolFeeInEthAmount: baseUnitAmount(15, 4),
            });
        });
        it('calculates a correct swapQuote with slippage (feeless orders)', async () => {
            const assetSellAmount = baseUnitAmount(1);
            const slippagePercentage = 0.2;
            const swapQuote = await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                testOrders.PRUNED_SIGNED_ORDERS_FEELESS,
                assetSellAmount,
                slippagePercentage,
                GAS_PRICE,
                mockProtocolFeeUtils.object,
            );

            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([
                testOrders.PRUNED_SIGNED_ORDERS_FEELESS[0],
                testOrders.PRUNED_SIGNED_ORDERS_FEELESS[1],
            ]);
            expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0),
                takerAssetAmount: assetSellAmount,
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(6),
                protocolFeeInEthAmount: baseUnitAmount(30, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0),
                takerAssetAmount: assetSellAmount,
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(0.4),
                protocolFeeInEthAmount: baseUnitAmount(30, 4),
            });
        });
        it('calculates a correct swapQuote with no slippage (takerAsset denominated fee orders)', async () => {
            const assetSellAmount = baseUnitAmount(4);
            const slippagePercentage = 0;
            const swapQuote = await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET,
                assetSellAmount,
                slippagePercentage,
                GAS_PRICE,
                mockProtocolFeeUtils.object,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET[0]]);
            expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(3),
                takerAssetAmount: assetSellAmount.minus(baseUnitAmount(3)),
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(6),
                protocolFeeInEthAmount: baseUnitAmount(15, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(3),
                takerAssetAmount: assetSellAmount.minus(baseUnitAmount(3)),
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(6),
                protocolFeeInEthAmount: baseUnitAmount(15, 4),
            });
        });
        it('calculates a correct swapQuote with slippage (takerAsset denominated fee orders)', async () => {
            const assetSellAmount = baseUnitAmount(3);
            const slippagePercentage = 0.5;
            const swapQuote = await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET,
                assetSellAmount,
                slippagePercentage,
                GAS_PRICE,
                mockProtocolFeeUtils.object,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET[0],
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET[1],
            ]);
            expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2.25),
                takerAssetAmount: assetSellAmount.minus(baseUnitAmount(2.25)),
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(4.5),
                protocolFeeInEthAmount: baseUnitAmount(30, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0.5),
                takerAssetAmount: assetSellAmount.minus(baseUnitAmount(0.5)),
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(1),
                protocolFeeInEthAmount: baseUnitAmount(30, 4),
            });
        });
        it('calculates a correct swapQuote with no slippage (makerAsset denominated fee orders)', async () => {
            const assetSellAmount = baseUnitAmount(4);
            const slippagePercentage = 0;
            const swapQuote = await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET,
                assetSellAmount,
                slippagePercentage,
                GAS_PRICE,
                mockProtocolFeeUtils.object,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET[0]]);
            expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2),
                takerAssetAmount: assetSellAmount.minus(baseUnitAmount(2)),
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(0.8),
                protocolFeeInEthAmount: baseUnitAmount(15, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2),
                takerAssetAmount: assetSellAmount.minus(baseUnitAmount(2)),
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(0.8),
                protocolFeeInEthAmount: baseUnitAmount(15, 4),
            });
        });
        it('calculates a correct swapQuote with slippage (makerAsset denominated fee orders)', async () => {
            const assetSellAmount = baseUnitAmount(4);
            const slippagePercentage = 0.5;
            const swapQuote = await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET,
                assetSellAmount,
                slippagePercentage,
                GAS_PRICE,
                mockProtocolFeeUtils.object,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET[0],
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET[1],
            ]);
            expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
            // test if rates are correct
            // 50 takerAsset units to fill the first order + 100 takerAsset units for fees
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2),
                takerAssetAmount: assetSellAmount.minus(baseUnitAmount(2)),
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(0.8),
                protocolFeeInEthAmount: baseUnitAmount(30, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2),
                takerAssetAmount: assetSellAmount.minus(baseUnitAmount(2)),
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(3.6),
                protocolFeeInEthAmount: baseUnitAmount(30, 4),
            });
        });
    });
    describe('#calculateMarketBuySwapQuoteAsync', () => {
        describe('InsufficientLiquidityError', () => {
            it('should throw if not enough maker asset liquidity (multiple feeless orders)', async () => {
                const errorFunction = async () => {
                    await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                        testOrders.PRUNED_SIGNED_ORDERS_FEELESS,
                        baseUnitAmount(12),
                        0,
                        GAS_PRICE,
                        mockProtocolFeeUtils.object,
                    );
                };
                await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(10));
            });
            it('should throw if not enough taker asset liquidity (multiple feeless orders with 20% slippage)', async () => {
                const errorFunction = async () => {
                    await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                        testOrders.PRUNED_SIGNED_ORDERS_FEELESS,
                        baseUnitAmount(10),
                        0.6,
                        GAS_PRICE,
                        mockProtocolFeeUtils.object,
                    );
                };
                await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(6.25));
            });
            it('should throw if not enough taker asset liquidity (multiple takerAsset denominated fee orders with no slippage)', async () => {
                const errorFunction = async () => {
                    await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                        testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET,
                        baseUnitAmount(12),
                        0,
                        GAS_PRICE,
                        mockProtocolFeeUtils.object,
                    );
                };
                await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(10));
            });
            it('should throw if not enough taker asset liquidity (multiple takerAsset denominated fee orders with 20% slippage)', async () => {
                const errorFunction = async () => {
                    await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                        testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET,
                        baseUnitAmount(12),
                        0.6,
                        GAS_PRICE,
                        mockProtocolFeeUtils.object,
                    );
                };
                await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(6.25));
            });
            it('should throw if not enough taker asset liquidity (multiple makerAsset denominated fee orders with no slippage)', async () => {
                const errorFunction = async () => {
                    await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                        testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET,
                        baseUnitAmount(6),
                        0,
                        GAS_PRICE,
                        mockProtocolFeeUtils.object,
                    );
                };
                await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(5));
            });
            it('should throw if not enough taker asset liquidity (multiple makerAsset denominated fee orders with 20% slippage)', async () => {
                const errorFunction = async () => {
                    await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                        testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET,
                        baseUnitAmount(6),
                        0.6,
                        GAS_PRICE,
                        mockProtocolFeeUtils.object,
                    );
                };
                await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(3.125));
            });
            it('should throw if not enough taker asset liquidity (multiple mixed feeType orders with no slippage)', async () => {
                const errorFunction = async () => {
                    await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                        MIXED_TEST_ORDERS,
                        baseUnitAmount(40),
                        0,
                        GAS_PRICE,
                        mockProtocolFeeUtils.object,
                    );
                };
                await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(25));
            });
            it('should throw if not enough taker asset liquidity (multiple mixed feeTyoe orders with 20% slippage)', async () => {
                const errorFunction = async () => {
                    await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                        MIXED_TEST_ORDERS,
                        baseUnitAmount(40),
                        0.6,
                        GAS_PRICE,
                        mockProtocolFeeUtils.object,
                    );
                };
                await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(15.625));
            });
        });
        it('calculates a correct swapQuote with no slippage (feeless orders)', async () => {
            const assetBuyAmount = baseUnitAmount(3);
            const slippagePercentage = 0;
            const swapQuote = await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                testOrders.PRUNED_SIGNED_ORDERS_FEELESS,
                assetBuyAmount,
                slippagePercentage,
                GAS_PRICE,
                mockProtocolFeeUtils.object,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([testOrders.PRUNED_SIGNED_ORDERS_FEELESS[0]]);
            expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0),
                takerAssetAmount: baseUnitAmount(0.5),
                totalTakerAssetAmount: baseUnitAmount(0.5),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInEthAmount: baseUnitAmount(15, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0),
                takerAssetAmount: baseUnitAmount(0.5),
                totalTakerAssetAmount: baseUnitAmount(0.5),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInEthAmount: baseUnitAmount(15, 4),
            });
        });
        it('calculates a correct swapQuote with slippage (feeless orders)', async () => {
            const assetBuyAmount = baseUnitAmount(5);
            const slippagePercentage = 0.5;
            const swapQuote = await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                testOrders.PRUNED_SIGNED_ORDERS_FEELESS,
                assetBuyAmount,
                slippagePercentage,
                GAS_PRICE,
                mockProtocolFeeUtils.object,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([
                testOrders.PRUNED_SIGNED_ORDERS_FEELESS[0],
                testOrders.PRUNED_SIGNED_ORDERS_FEELESS[1],
            ]);
            expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);

            const takerAssetAmount = new BigNumber(5)
                .div(new BigNumber(6))
                .multipliedBy(ONE_ETH_IN_WEI)
                .integerValue(BigNumber.ROUND_CEIL);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0),
                takerAssetAmount,
                totalTakerAssetAmount: takerAssetAmount,
                makerAssetAmount: assetBuyAmount,
                protocolFeeInEthAmount: baseUnitAmount(30, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0),
                takerAssetAmount: baseUnitAmount(5.5),
                totalTakerAssetAmount: baseUnitAmount(5.5),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInEthAmount: baseUnitAmount(30, 4),
            });
        });
        it('calculates a correct swapQuote with no slippage (takerAsset denominated fee orders)', async () => {
            const assetBuyAmount = baseUnitAmount(3);
            const slippagePercentage = 0;
            const swapQuote = await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET,
                assetBuyAmount,
                slippagePercentage,
                GAS_PRICE,
                mockProtocolFeeUtils.object,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET[0]]);
            expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(1.5),
                takerAssetAmount: baseUnitAmount(0.5),
                totalTakerAssetAmount: baseUnitAmount(2),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInEthAmount: baseUnitAmount(15, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(1.5),
                takerAssetAmount: baseUnitAmount(0.5),
                totalTakerAssetAmount: baseUnitAmount(2),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInEthAmount: baseUnitAmount(15, 4),
            });
        });
        it('calculates a correct swapQuote with slippage (takerAsset denominated fee orders)', async () => {
            const assetBuyAmount = baseUnitAmount(5);
            const slippagePercentage = 0.5;
            const swapQuote = await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET,
                assetBuyAmount,
                slippagePercentage,
                GAS_PRICE,
                mockProtocolFeeUtils.object,
            );
            const fiveSixthEthInWei = new BigNumber(5)
                .div(new BigNumber(6))
                .multipliedBy(ONE_ETH_IN_WEI)
                .integerValue(BigNumber.ROUND_CEIL);
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET[0],
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET[1],
            ]);
            expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2.5),
                takerAssetAmount: fiveSixthEthInWei,
                totalTakerAssetAmount: baseUnitAmount(2.5).plus(fiveSixthEthInWei),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInEthAmount: baseUnitAmount(30, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2.5),
                takerAssetAmount: baseUnitAmount(5.5),
                totalTakerAssetAmount: baseUnitAmount(8),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInEthAmount: baseUnitAmount(30, 4),
            });
        });
        it('calculates a correct swapQuote with no slippage (makerAsset denominated fee orders)', async () => {
            const assetBuyAmount = baseUnitAmount(1);
            const slippagePercentage = 0;
            const swapQuote = await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET,
                assetBuyAmount,
                slippagePercentage,
                GAS_PRICE,
                mockProtocolFeeUtils.object,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET[0]]);
            expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2.5),
                takerAssetAmount: baseUnitAmount(2.5),
                totalTakerAssetAmount: baseUnitAmount(5),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInEthAmount: baseUnitAmount(15, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2.5),
                takerAssetAmount: baseUnitAmount(2.5),
                totalTakerAssetAmount: baseUnitAmount(5),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInEthAmount: baseUnitAmount(15, 4),
            });
        });
        it('calculates a correct swapQuote with slippage (makerAsset denominated fee orders)', async () => {
            const assetBuyAmount = baseUnitAmount(2.5);
            const slippagePercentage = 0.5;
            const swapQuote = await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET,
                assetBuyAmount,
                slippagePercentage,
                GAS_PRICE,
                mockProtocolFeeUtils.object,
            );
            const totalTakerAssetAmount = new BigNumber(5)
                .div(new BigNumber(6))
                .multipliedBy(ONE_ETH_IN_WEI)
                .integerValue(BigNumber.ROUND_CEIL);
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET[0],
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET[1],
            ]);
            expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);
            // test if rates are correct
            // 50 takerAsset units to fill the first order + 100 takerAsset units for fees
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2.75),
                takerAssetAmount: baseUnitAmount(2.75),
                totalTakerAssetAmount: baseUnitAmount(5.5),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInEthAmount: baseUnitAmount(30, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: totalTakerAssetAmount.div(2),
                takerAssetAmount: totalTakerAssetAmount.div(2),
                totalTakerAssetAmount,
                makerAssetAmount: assetBuyAmount,
                protocolFeeInEthAmount: baseUnitAmount(30, 4),
            });
        });
    });
});
