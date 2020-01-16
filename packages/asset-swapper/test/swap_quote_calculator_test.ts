import { constants as devConstants } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { ContractAddresses, migrateOnceAsync } from '@0x/migrations';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import { constants } from '../src/constants';
import { CalculateSwapQuoteOpts, SignedOrderWithFillableAmounts } from '../src/types';
import { MarketOperationUtils } from '../src/utils/market_operation_utils/';
import { constants as marketOperationUtilConstants } from '../src/utils/market_operation_utils/constants';
import { ProtocolFeeUtils } from '../src/utils/protocol_fee_utils';
import { SwapQuoteCalculator } from '../src/utils/swap_quote_calculator';

import { chaiSetup } from './utils/chai_setup';
import { MockSamplerContract } from './utils/mock_sampler_contract';
import { protocolFeeUtilsMock } from './utils/mocks';
import { testOrders } from './utils/test_orders';
import { baseUnitAmount } from './utils/utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const GAS_PRICE = new BigNumber(devConstants.DEFAULT_GAS_PRICE);
const ONE_ETH_IN_WEI = new BigNumber(1000000000000000000);
// const MIXED_TEST_ORDERS = _.concat(
//     testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
//     testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
//     testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
// );
const TESTRPC_CHAIN_ID = devConstants.TESTRPC_CHAIN_ID;

const { DEFAULT_GET_MARKET_ORDERS_OPTS, SELL_SOURCES } = marketOperationUtilConstants;

// Excludes all non native sources
const CALCULATE_SWAP_QUOTE_OPTS: CalculateSwapQuoteOpts = {
    ...DEFAULT_GET_MARKET_ORDERS_OPTS,
    ...{
        excludedSources: SELL_SOURCES,
    },
};

const createSamplerFromSignedOrdersWithFillableAmounts = (
    signedOrders: SignedOrderWithFillableAmounts[],
): MockSamplerContract => {
    const sampler = new MockSamplerContract({
        queryOrdersAndSampleBuys: (orders, signatures, sources, fillAmounts) => {
            const fillableAmounts = signatures.map((s: string) => {
                const order = (signedOrders.find(o => o.signature === s) as any) as SignedOrderWithFillableAmounts;
                return order.fillableMakerAssetAmount;
            });
            return [fillableAmounts, sources.map(() => fillAmounts.map(() => constants.ZERO_AMOUNT))];
        },
        queryOrdersAndSampleSells: (orders, signatures, sources, fillAmounts) => {
            const fillableAmounts = signatures.map((s: string) => {
                const order = (signedOrders.find(o => o.signature === s) as any) as SignedOrderWithFillableAmounts;
                return order.fillableTakerAssetAmount;
            });
            return [fillableAmounts, sources.map(() => fillAmounts.map(() => constants.ZERO_AMOUNT))];
        },
    });
    return sampler;
};

// tslint:disable:max-file-line-count
// tslint:disable:custom-no-magic-numbers
describe('swapQuoteCalculator', () => {
    let protocolFeeUtils: ProtocolFeeUtils;
    let contractAddresses: ContractAddresses;

    before(async () => {
        contractAddresses = await migrateOnceAsync(provider);
        protocolFeeUtils = protocolFeeUtilsMock().object;
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('#calculateMarketSellSwapQuote', () => {
        // TODO(dave4506) InsufficientLiquidityError is not thrown anymore, consider how to test for insufficient liquidity
        // describe('InsufficientLiquidityError', () => {
        //     it('should throw if not enough taker asset liquidity (multiple feeless orders)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
        //         const errorFunction = async () => {
        //             await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
        //                 testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
        //                 baseUnitAmount(10),
        //                 0,
        //                 GAS_PRICE,
        //                 CALCULATE_SWAP_QUOTE_OPTS,
        //             );
        //         };
        //         await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(9));
        //     });
        //     it('should throw if not enough taker asset liquidity (multiple feeless orders with 20% slippage)', async () => {
        //         const errorFunction = async () => {
        //             const sampler = createSamplerFromSignedOrdersWithFillableAmounts(testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS);
        //             const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //                 exchangeAddress: contractAddresses.exchange,
        //                 chainId: TESTRPC_CHAIN_ID,
        //             });
        //             const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
        //             await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
        //                 testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
        //                 baseUnitAmount(10),
        //                 0.2,
        //                 GAS_PRICE,
        //                 CALCULATE_SWAP_QUOTE_OPTS,
        //             );
        //         };
        //         await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(7.5));
        //     });
        //     it('should throw if not enough taker asset liquidity (multiple takerAsset denominated fee orders with no slippage)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
        //         const errorFunction = async () => {
        //             await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
        //                 testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
        //                 baseUnitAmount(20),
        //                 0,
        //                 GAS_PRICE,
        //                 CALCULATE_SWAP_QUOTE_OPTS,
        //             );
        //         };
        //         await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(15));
        //     });
        //     it('should throw if not enough taker asset liquidity (multiple takerAsset denominated fee orders with 20% slippage)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
        //         const errorFunction = async () => {
        //             await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
        //                 testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
        //                 baseUnitAmount(20),
        //                 0.2,
        //                 GAS_PRICE,
        //                 CALCULATE_SWAP_QUOTE_OPTS,
        //             );
        //         };
        //         await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(12.5));
        //     });
        //     it('should throw if not enough taker asset liquidity (multiple makerAsset denominated fee orders with no slippage)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
        //         const errorFunction = async () => {
        //             await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
        //                 testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
        //                 baseUnitAmount(10),
        //                 0,
        //                 GAS_PRICE,
        //                 CALCULATE_SWAP_QUOTE_OPTS,
        //             );
        //         };
        //         await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(9));
        //     });
        //     it('should throw if not enough taker asset liquidity (multiple makerAsset denominated fee orders with 20% slippage)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
        //         const errorFunction = async () => {
        //             await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
        //                 testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
        //                 baseUnitAmount(10),
        //                 0.2,
        //                 GAS_PRICE,
        //                 CALCULATE_SWAP_QUOTE_OPTS,
        //             );
        //         };
        //         await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(7.5));
        //     });
        //     it('should throw if not enough taker asset liquidity (multiple mixed feeType orders with no slippage)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(MIXED_TEST_ORDERS);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
        //         const errorFunction = async () => {
        //             await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
        //                 MIXED_TEST_ORDERS,
        //                 baseUnitAmount(40),
        //                 0,
        //                 GAS_PRICE,
        //                 CALCULATE_SWAP_QUOTE_OPTS,
        //             );
        //         };
        //         await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(33));
        //     });
        //     it('should throw if not enough taker asset liquidity (multiple mixed feeTyoe orders with 20% slippage)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(MIXED_TEST_ORDERS);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
        //         const errorFunction = async () => {
        //             await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
        //                 MIXED_TEST_ORDERS,
        //                 baseUnitAmount(40),
        //                 0.2,
        //                 GAS_PRICE,
        //                 CALCULATE_SWAP_QUOTE_OPTS,
        //             );
        //         };
        //         await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(27.5));
        //     });
        // });
        it('calculates a correct swapQuote with no slippage (feeless orders)', async () => {
            const assetSellAmount = baseUnitAmount(0.5);
            const slippagePercentage = 0;
            const sampler = createSamplerFromSignedOrdersWithFillableAmounts(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
            );
            const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
                exchangeAddress: contractAddresses.exchange,
                chainId: TESTRPC_CHAIN_ID,
            });
            const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
            const swapQuote = await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
                assetSellAmount,
                slippagePercentage,
                GAS_PRICE,
                CALCULATE_SWAP_QUOTE_OPTS,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS[0]]);
            expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0),
                takerAssetAmount: assetSellAmount,
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(3),
                protocolFeeInWeiAmount: baseUnitAmount(15, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0),
                takerAssetAmount: assetSellAmount,
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(3),
                protocolFeeInWeiAmount: baseUnitAmount(15, 4),
            });
        });
        it('calculates a correct swapQuote with slippage (feeless orders)', async () => {
            const assetSellAmount = baseUnitAmount(1);
            const slippagePercentage = 0.2;
            const sampler = createSamplerFromSignedOrdersWithFillableAmounts(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
            );
            const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
                exchangeAddress: contractAddresses.exchange,
                chainId: TESTRPC_CHAIN_ID,
            });
            const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
            const swapQuote = await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
                assetSellAmount,
                slippagePercentage,
                GAS_PRICE,
                CALCULATE_SWAP_QUOTE_OPTS,
            );

            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS[0],
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS[1],
            ]);
            expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0),
                takerAssetAmount: assetSellAmount,
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(6),
                protocolFeeInWeiAmount: baseUnitAmount(15, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0),
                takerAssetAmount: assetSellAmount,
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(0.4),
                protocolFeeInWeiAmount: baseUnitAmount(15, 4),
            });
        });
        it.only('calculates a correct swapQuote with no slippage (takerAsset denominated fee orders)', async () => {
            const assetSellAmount = baseUnitAmount(7);
            const slippagePercentage = 0;
            const sampler = createSamplerFromSignedOrdersWithFillableAmounts(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
            );
            const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
                exchangeAddress: contractAddresses.exchange,
                chainId: TESTRPC_CHAIN_ID,
            });
            const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
            const swapQuote = await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
                assetSellAmount,
                slippagePercentage,
                GAS_PRICE,
                CALCULATE_SWAP_QUOTE_OPTS,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET[0],
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET[1],
            ]);
            expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(3),
                takerAssetAmount: assetSellAmount.minus(baseUnitAmount(3)),
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(6),
                protocolFeeInWeiAmount: baseUnitAmount(15, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(3),
                takerAssetAmount: assetSellAmount.minus(baseUnitAmount(3)),
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(6),
                protocolFeeInWeiAmount: baseUnitAmount(30, 4),
            });
        });
        it('calculates a correct swapQuote with slippage (takerAsset denominated fee orders)', async () => {
            const assetSellAmount = baseUnitAmount(3);
            const slippagePercentage = 0.5;
            const sampler = createSamplerFromSignedOrdersWithFillableAmounts(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
            );
            const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
                exchangeAddress: contractAddresses.exchange,
                chainId: TESTRPC_CHAIN_ID,
            });
            const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
            const swapQuote = await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
                assetSellAmount,
                slippagePercentage,
                GAS_PRICE,
                CALCULATE_SWAP_QUOTE_OPTS,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET[0],
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET[1],
            ]);
            expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2.25),
                takerAssetAmount: assetSellAmount.minus(baseUnitAmount(2.25)),
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(4.5),
                protocolFeeInWeiAmount: baseUnitAmount(15, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0.5),
                takerAssetAmount: assetSellAmount.minus(baseUnitAmount(0.5)),
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(1),
                protocolFeeInWeiAmount: baseUnitAmount(30, 4),
            });
        });
        it('calculates a correct swapQuote with no slippage (makerAsset denominated fee orders)', async () => {
            const assetSellAmount = baseUnitAmount(4);
            const slippagePercentage = 0;
            const sampler = createSamplerFromSignedOrdersWithFillableAmounts(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
            );
            const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
                exchangeAddress: contractAddresses.exchange,
                chainId: TESTRPC_CHAIN_ID,
            });
            const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
            const swapQuote = await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
                assetSellAmount,
                slippagePercentage,
                GAS_PRICE,
                CALCULATE_SWAP_QUOTE_OPTS,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET[0],
            ]);
            expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2),
                takerAssetAmount: assetSellAmount.minus(baseUnitAmount(2)),
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(0.8),
                protocolFeeInWeiAmount: baseUnitAmount(15, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2),
                takerAssetAmount: assetSellAmount.minus(baseUnitAmount(2)),
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(0.8),
                protocolFeeInWeiAmount: baseUnitAmount(15, 4),
            });
        });
        it('calculates a correct swapQuote with slippage (makerAsset denominated fee orders)', async () => {
            const assetSellAmount = baseUnitAmount(4);
            const slippagePercentage = 0.5;
            const sampler = createSamplerFromSignedOrdersWithFillableAmounts(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
            );
            const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
                exchangeAddress: contractAddresses.exchange,
                chainId: TESTRPC_CHAIN_ID,
            });
            const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
            const swapQuote = await swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
                assetSellAmount,
                slippagePercentage,
                GAS_PRICE,
                CALCULATE_SWAP_QUOTE_OPTS,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET[1],
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET[0],
            ]);
            expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
            // test if rates are correct
            // 50 takerAsset units to fill the first order + 100 takerAsset units for fees
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2),
                takerAssetAmount: assetSellAmount.minus(baseUnitAmount(2)),
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(0.8),
                protocolFeeInWeiAmount: baseUnitAmount(30, 4),
            });
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2),
                takerAssetAmount: assetSellAmount.minus(baseUnitAmount(2)),
                totalTakerAssetAmount: assetSellAmount,
                makerAssetAmount: baseUnitAmount(3.6),
                protocolFeeInWeiAmount: baseUnitAmount(30, 4),
            });
        });
    });
    describe('#calculateMarketBuySwapQuoteAsync', () => {
        // TODO(dave4506) InsufficientLiquidityError is not thrown anymore, consider how to test for insufficient liquidity
        // describe('InsufficientLiquidityError', () => {
        //     it('should throw if not enough maker asset liquidity (multiple feeless orders)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
        //         const errorFunction = async () => {
        //             await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
        //                 testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
        //                 baseUnitAmount(12),
        //                 0,
        //                 GAS_PRICE,
        //                 CALCULATE_SWAP_QUOTE_OPTS,
        //             );
        //         };
        //         await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(10));
        //     });
        //     it('should throw if not enough taker asset liquidity (multiple feeless orders with 20% slippage)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
        //         const errorFunction = async () => {
        //             await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
        //                 testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
        //                 baseUnitAmount(10),
        //                 0.6,
        //                 GAS_PRICE,
        //                 CALCULATE_SWAP_QUOTE_OPTS,
        //             );
        //         };
        //         await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(6.25));
        //     });
        //     it('should throw if not enough taker asset liquidity (multiple takerAsset denominated fee orders with no slippage)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
        //         const errorFunction = async () => {
        //             await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
        //                 testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
        //                 baseUnitAmount(12),
        //                 0,
        //                 GAS_PRICE,
        //                 CALCULATE_SWAP_QUOTE_OPTS,
        //             );
        //         };
        //         await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(10));
        //     });
        //     it('should throw if not enough taker asset liquidity (multiple takerAsset denominated fee orders with 20% slippage)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
        //         const errorFunction = async () => {
        //             await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
        //                 testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
        //                 baseUnitAmount(12),
        //                 0.6,
        //                 GAS_PRICE,
        //                 CALCULATE_SWAP_QUOTE_OPTS,
        //             );
        //         };
        //         await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(6.25));
        //     });
        //     it('should throw if not enough taker asset liquidity (multiple makerAsset denominated fee orders with no slippage)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
        //         const errorFunction = async () => {
        //             await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
        //                 testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
        //                 baseUnitAmount(6),
        //                 0,
        //                 GAS_PRICE,
        //                 CALCULATE_SWAP_QUOTE_OPTS,
        //             );
        //         };
        //         await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(5));
        //     });
        //     it('should throw if not enough taker asset liquidity (multiple makerAsset denominated fee orders with 20% slippage)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
        //         const errorFunction = async () => {
        //             await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
        //                 testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
        //                 baseUnitAmount(6),
        //                 0.6,
        //                 GAS_PRICE,
        //                 CALCULATE_SWAP_QUOTE_OPTS,
        //             );
        //         };
        //         await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(3.125));
        //     });
        //     it('should throw if not enough taker asset liquidity (multiple mixed feeType orders with no slippage)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(MIXED_TEST_ORDERS);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
        //         const errorFunction = async () => {
        //             await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
        //                 MIXED_TEST_ORDERS,
        //                 baseUnitAmount(40),
        //                 0,
        //                 GAS_PRICE,
        //                 CALCULATE_SWAP_QUOTE_OPTS,
        //             );
        //         };
        //         await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(25));
        //     });
        //     it('should throw if not enough taker asset liquidity (multiple mixed feeTyoe orders with 20% slippage)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(MIXED_TEST_ORDERS);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
        //         const errorFunction = async () => {
        //             await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
        //                 MIXED_TEST_ORDERS,
        //                 baseUnitAmount(40),
        //                 0.6,
        //                 GAS_PRICE,
        //                 CALCULATE_SWAP_QUOTE_OPTS,
        //             );
        //         };
        //         await testHelpers.expectInsufficientLiquidityErrorAsync(expect, errorFunction, baseUnitAmount(15.625));
        //     });
        // });
        it('calculates a correct swapQuote with no slippage (feeless orders)', async () => {
            const assetBuyAmount = baseUnitAmount(3);
            const slippagePercentage = 0;
            const sampler = createSamplerFromSignedOrdersWithFillableAmounts(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
            );
            const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
                exchangeAddress: contractAddresses.exchange,
                chainId: TESTRPC_CHAIN_ID,
            });
            const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
            const swapQuote = await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
                assetBuyAmount,
                slippagePercentage,
                GAS_PRICE,
                CALCULATE_SWAP_QUOTE_OPTS,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS[0]]);
            expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0),
                takerAssetAmount: baseUnitAmount(0.5),
                totalTakerAssetAmount: baseUnitAmount(0.5),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInWeiAmount: baseUnitAmount(15, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0),
                takerAssetAmount: baseUnitAmount(0.5),
                totalTakerAssetAmount: baseUnitAmount(0.5),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInWeiAmount: baseUnitAmount(15, 4),
            });
        });
        it('calculates a correct swapQuote with slippage (feeless orders)', async () => {
            const assetBuyAmount = baseUnitAmount(5);
            const slippagePercentage = 0.5;
            const sampler = createSamplerFromSignedOrdersWithFillableAmounts(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
            );
            const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
                exchangeAddress: contractAddresses.exchange,
                chainId: TESTRPC_CHAIN_ID,
            });
            const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
            const swapQuote = await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
                assetBuyAmount,
                slippagePercentage,
                GAS_PRICE,
                CALCULATE_SWAP_QUOTE_OPTS,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS[0],
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS[1],
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
                protocolFeeInWeiAmount: baseUnitAmount(30, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(0),
                takerAssetAmount: baseUnitAmount(5.5),
                totalTakerAssetAmount: baseUnitAmount(5.5),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInWeiAmount: baseUnitAmount(30, 4),
            });
        });
        it('calculates a correct swapQuote with no slippage (takerAsset denominated fee orders)', async () => {
            const assetBuyAmount = baseUnitAmount(3);
            const slippagePercentage = 0;
            const sampler = createSamplerFromSignedOrdersWithFillableAmounts(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
            );
            const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
                exchangeAddress: contractAddresses.exchange,
                chainId: TESTRPC_CHAIN_ID,
            });
            const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
            const swapQuote = await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
                assetBuyAmount,
                slippagePercentage,
                GAS_PRICE,
                CALCULATE_SWAP_QUOTE_OPTS,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET[0],
            ]);
            expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(1.5),
                takerAssetAmount: baseUnitAmount(0.5),
                totalTakerAssetAmount: baseUnitAmount(2),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInWeiAmount: baseUnitAmount(15, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(1.5),
                takerAssetAmount: baseUnitAmount(0.5),
                totalTakerAssetAmount: baseUnitAmount(2),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInWeiAmount: baseUnitAmount(15, 4),
            });
        });
        it('calculates a correct swapQuote with slippage (takerAsset denominated fee orders)', async () => {
            const assetBuyAmount = baseUnitAmount(5);
            const slippagePercentage = 0.5;
            const sampler = createSamplerFromSignedOrdersWithFillableAmounts(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
            );
            const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
                exchangeAddress: contractAddresses.exchange,
                chainId: TESTRPC_CHAIN_ID,
            });
            const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
            const swapQuote = await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
                assetBuyAmount,
                slippagePercentage,
                GAS_PRICE,
                CALCULATE_SWAP_QUOTE_OPTS,
            );
            const fiveSixthEthInWei = new BigNumber(5)
                .div(new BigNumber(6))
                .multipliedBy(ONE_ETH_IN_WEI)
                .integerValue(BigNumber.ROUND_CEIL);
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET[0],
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET[1],
            ]);
            expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2.5),
                takerAssetAmount: fiveSixthEthInWei,
                totalTakerAssetAmount: baseUnitAmount(2.5).plus(fiveSixthEthInWei),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInWeiAmount: baseUnitAmount(30, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2.5),
                takerAssetAmount: baseUnitAmount(5.5),
                totalTakerAssetAmount: baseUnitAmount(8),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInWeiAmount: baseUnitAmount(30, 4),
            });
        });
        it('calculates a correct swapQuote with no slippage (makerAsset denominated fee orders)', async () => {
            const assetBuyAmount = baseUnitAmount(1);
            const slippagePercentage = 0;
            const sampler = createSamplerFromSignedOrdersWithFillableAmounts(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
            );
            const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
                exchangeAddress: contractAddresses.exchange,
                chainId: TESTRPC_CHAIN_ID,
            });
            const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
            const swapQuote = await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
                assetBuyAmount,
                slippagePercentage,
                GAS_PRICE,
                CALCULATE_SWAP_QUOTE_OPTS,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET[0],
            ]);
            expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);
            // test if rates are correct
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2.5),
                takerAssetAmount: baseUnitAmount(2.5),
                totalTakerAssetAmount: baseUnitAmount(5),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInWeiAmount: baseUnitAmount(15, 4),
            });
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2.5),
                takerAssetAmount: baseUnitAmount(2.5),
                totalTakerAssetAmount: baseUnitAmount(5),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInWeiAmount: baseUnitAmount(15, 4),
            });
        });
        it('calculates a correct swapQuote with slippage (makerAsset denominated fee orders)', async () => {
            const assetBuyAmount = baseUnitAmount(2.5);
            const slippagePercentage = 0.48;
            const sampler = createSamplerFromSignedOrdersWithFillableAmounts(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
            );
            const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
                exchangeAddress: contractAddresses.exchange,
                chainId: TESTRPC_CHAIN_ID,
            });
            const swapQuoteCalculator = new SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
            const swapQuote = await swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
                assetBuyAmount,
                slippagePercentage,
                GAS_PRICE,
                CALCULATE_SWAP_QUOTE_OPTS,
            );
            // test if orders are correct
            expect(swapQuote.orders).to.deep.equal([
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET[1],
                testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET[0],
            ]);
            expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);
            // test if rates are correct
            expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(2.75),
                takerAssetAmount: baseUnitAmount(2.75),
                totalTakerAssetAmount: baseUnitAmount(5.5),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInWeiAmount: baseUnitAmount(30, 4),
            });

            const oneThirdEthInWei = new BigNumber(1)
                .div(new BigNumber(3))
                .multipliedBy(ONE_ETH_IN_WEI)
                .integerValue(BigNumber.ROUND_CEIL);
            const oneSixthEthInWei = new BigNumber(1)
                .div(new BigNumber(6))
                .multipliedBy(ONE_ETH_IN_WEI)
                .integerValue(BigNumber.ROUND_CEIL);
            expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                feeTakerAssetAmount: baseUnitAmount(4)
                    .plus(oneSixthEthInWei)
                    .multipliedBy(0.1)
                    .integerValue(BigNumber.ROUND_CEIL),
                takerAssetAmount: baseUnitAmount(4)
                    .plus(oneSixthEthInWei)
                    .multipliedBy(0.1)
                    .integerValue(BigNumber.ROUND_CEIL),
                totalTakerAssetAmount: baseUnitAmount(8)
                    .plus(oneThirdEthInWei)
                    .multipliedBy(0.1)
                    .integerValue(BigNumber.ROUND_CEIL),
                makerAssetAmount: assetBuyAmount,
                protocolFeeInWeiAmount: baseUnitAmount(30, 4),
            });
        });
    });
});
