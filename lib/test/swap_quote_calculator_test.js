"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var contracts_test_utils_1 = require("@0x/contracts-test-utils");
var dev_utils_1 = require("@0x/dev-utils");
var migrations_1 = require("@0x/migrations");
var utils_1 = require("@0x/utils");
var chai = require("chai");
require("mocha");
var constants_1 = require("../src/constants");
var market_operation_utils_1 = require("../src/utils/market_operation_utils/");
var constants_2 = require("../src/utils/market_operation_utils/constants");
var swap_quote_calculator_1 = require("../src/utils/swap_quote_calculator");
var chai_setup_1 = require("./utils/chai_setup");
var mock_sampler_contract_1 = require("./utils/mock_sampler_contract");
var mocks_1 = require("./utils/mocks");
var test_orders_1 = require("./utils/test_orders");
var utils_2 = require("./utils/utils");
var web3_wrapper_1 = require("./utils/web3_wrapper");
chai_setup_1.chaiSetup.configure();
var expect = chai.expect;
var blockchainLifecycle = new dev_utils_1.BlockchainLifecycle(web3_wrapper_1.web3Wrapper);
var GAS_PRICE = new utils_1.BigNumber(contracts_test_utils_1.constants.DEFAULT_GAS_PRICE);
var ONE_ETH_IN_WEI = new utils_1.BigNumber(1000000000000000000);
// const MIXED_TEST_ORDERS = _.concat(
//     testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
//     testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
//     testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
// );
var TESTRPC_CHAIN_ID = contracts_test_utils_1.constants.TESTRPC_CHAIN_ID;
var DEFAULT_GET_MARKET_ORDERS_OPTS = constants_2.constants.DEFAULT_GET_MARKET_ORDERS_OPTS, SELL_SOURCES = constants_2.constants.SELL_SOURCES;
// Excludes all non native sources
var CALCULATE_SWAP_QUOTE_OPTS = __assign({}, DEFAULT_GET_MARKET_ORDERS_OPTS, {
    excludedSources: SELL_SOURCES,
});
function createSamplerFromSignedOrdersWithFillableAmounts(signedOrders) {
    var sampleDexHandler = function (takerToken, makerToken, amounts) {
        return amounts.map(function () { return constants_1.constants.ZERO_AMOUNT; });
    };
    return new market_operation_utils_1.DexOrderSampler(new mock_sampler_contract_1.MockSamplerContract({
        getOrderFillableMakerAssetAmounts: function (orders, signatures) {
            return orders.map(function (o, i) { return signedOrders[i].fillableMakerAssetAmount; });
        },
        getOrderFillableTakerAssetAmounts: function (orders, signatures) {
            return orders.map(function (o, i) { return signedOrders[i].fillableTakerAssetAmount; });
        },
        sampleSellsFromEth2Dai: sampleDexHandler,
        sampleSellsFromKyberNetwork: sampleDexHandler,
        sampleSellsFromUniswap: sampleDexHandler,
        sampleBuysFromEth2Dai: sampleDexHandler,
        sampleBuysFromUniswap: sampleDexHandler,
    }));
}
// tslint:disable:max-file-line-count
// tslint:disable:custom-no-magic-numbers
// TODO(dorothy-zbornak): Skipping these tests for now because they're a
// nightmare to maintain. We should replace them with simpler unit tests.
describe.skip('swapQuoteCalculator', function () {
    var protocolFeeUtils;
    var contractAddresses;
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, migrations_1.migrateOnceAsync(web3_wrapper_1.provider)];
                case 1:
                    contractAddresses = _a.sent();
                    protocolFeeUtils = mocks_1.protocolFeeUtilsMock().object;
                    return [4 /*yield*/, blockchainLifecycle.startAsync()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    after(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, blockchainLifecycle.revertAsync()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, blockchainLifecycle.startAsync()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, blockchainLifecycle.revertAsync()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    describe('#calculateMarketSellSwapQuote', function () {
        // TODO(dave4506) InsufficientLiquidityError is not thrown anymore, consider how to test for insufficient liquidity
        // describe('InsufficientLiquidityError', () => {
        //     it('should throw if not enough taker asset liquidity (multiple feeless orders)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator( protocolFeeUtils, marketOperationUtils);
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
        //             const swapQuoteCalculator = new SwapQuoteCalculator( protocolFeeUtils, marketOperationUtils);
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
        //         const swapQuoteCalculator = new SwapQuoteCalculator( protocolFeeUtils, marketOperationUtils);
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
        //         const swapQuoteCalculator = new SwapQuoteCalculator( protocolFeeUtils, marketOperationUtils);
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
        //         const swapQuoteCalculator = new SwapQuoteCalculator( protocolFeeUtils, marketOperationUtils);
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
        //         const swapQuoteCalculator = new SwapQuoteCalculator( protocolFeeUtils, marketOperationUtils);
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
        //         const swapQuoteCalculator = new SwapQuoteCalculator( protocolFeeUtils, marketOperationUtils);
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
        //         const swapQuoteCalculator = new SwapQuoteCalculator( protocolFeeUtils, marketOperationUtils);
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
        it('calculates a correct swapQuote with no slippage (feeless orders)', function () { return __awaiter(_this, void 0, void 0, function () {
            var assetSellAmount, slippagePercentage, sampler, marketOperationUtils, swapQuoteCalculator, swapQuote;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assetSellAmount = utils_2.baseUnitAmount(0.5);
                        slippagePercentage = 0;
                        sampler = createSamplerFromSignedOrdersWithFillableAmounts(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS);
                        marketOperationUtils = new market_operation_utils_1.MarketOperationUtils(sampler, contractAddresses, {
                            exchangeAddress: contractAddresses.exchange,
                            chainId: TESTRPC_CHAIN_ID,
                        });
                        swapQuoteCalculator = new swap_quote_calculator_1.SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
                        return [4 /*yield*/, swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS, assetSellAmount, slippagePercentage, GAS_PRICE, CALCULATE_SWAP_QUOTE_OPTS)];
                    case 1:
                        swapQuote = _a.sent();
                        // test if orders are correct
                        expect(swapQuote.orders).to.deep.equal([test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS[0]]);
                        expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
                        // test if rates are correct
                        expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(0),
                            takerAssetAmount: assetSellAmount,
                            totalTakerAssetAmount: assetSellAmount,
                            makerAssetAmount: utils_2.baseUnitAmount(3),
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(15, 4),
                        });
                        expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(0),
                            takerAssetAmount: assetSellAmount,
                            totalTakerAssetAmount: assetSellAmount,
                            makerAssetAmount: utils_2.baseUnitAmount(3),
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(15, 4),
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('calculates a correct swapQuote with slippage (feeless orders)', function () { return __awaiter(_this, void 0, void 0, function () {
            var assetSellAmount, slippagePercentage, sampler, marketOperationUtils, swapQuoteCalculator, swapQuote;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assetSellAmount = utils_2.baseUnitAmount(4);
                        slippagePercentage = 0.2;
                        sampler = createSamplerFromSignedOrdersWithFillableAmounts(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS);
                        marketOperationUtils = new market_operation_utils_1.MarketOperationUtils(sampler, contractAddresses, {
                            exchangeAddress: contractAddresses.exchange,
                            chainId: TESTRPC_CHAIN_ID,
                        });
                        swapQuoteCalculator = new swap_quote_calculator_1.SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
                        return [4 /*yield*/, swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS, assetSellAmount, slippagePercentage, GAS_PRICE, CALCULATE_SWAP_QUOTE_OPTS)];
                    case 1:
                        swapQuote = _a.sent();
                        // test if orders are correct
                        expect(swapQuote.orders).to.deep.equal([
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS[0],
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS[1],
                        ]);
                        expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
                        // test if rates are correct
                        expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(0),
                            takerAssetAmount: assetSellAmount,
                            totalTakerAssetAmount: assetSellAmount,
                            makerAssetAmount: utils_2.baseUnitAmount(9),
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(30, 4),
                        });
                        expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(0),
                            takerAssetAmount: assetSellAmount,
                            totalTakerAssetAmount: assetSellAmount,
                            makerAssetAmount: utils_2.baseUnitAmount(1.6),
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(45, 4),
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('calculates a correct swapQuote with no slippage (takerAsset denominated fee orders)', function () { return __awaiter(_this, void 0, void 0, function () {
            var assetSellAmount, slippagePercentage, sampler, marketOperationUtils, swapQuoteCalculator, swapQuote;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assetSellAmount = utils_2.baseUnitAmount(4);
                        slippagePercentage = 0;
                        sampler = createSamplerFromSignedOrdersWithFillableAmounts(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET);
                        marketOperationUtils = new market_operation_utils_1.MarketOperationUtils(sampler, contractAddresses, {
                            exchangeAddress: contractAddresses.exchange,
                            chainId: TESTRPC_CHAIN_ID,
                        });
                        swapQuoteCalculator = new swap_quote_calculator_1.SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
                        return [4 /*yield*/, swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET, assetSellAmount, slippagePercentage, GAS_PRICE, CALCULATE_SWAP_QUOTE_OPTS)];
                    case 1:
                        swapQuote = _a.sent();
                        // test if orders are correct
                        expect(swapQuote.orders).to.deep.equal([
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET[0],
                        ]);
                        expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
                        // test if rates are correct
                        expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(3),
                            takerAssetAmount: assetSellAmount.minus(utils_2.baseUnitAmount(3)),
                            totalTakerAssetAmount: assetSellAmount,
                            makerAssetAmount: utils_2.baseUnitAmount(6),
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(15, 4),
                        });
                        expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(3),
                            takerAssetAmount: assetSellAmount.minus(utils_2.baseUnitAmount(3)),
                            totalTakerAssetAmount: assetSellAmount,
                            makerAssetAmount: utils_2.baseUnitAmount(6),
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(15, 4),
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('calculates a correct swapQuote with slippage (takerAsset denominated fee orders)', function () { return __awaiter(_this, void 0, void 0, function () {
            var assetSellAmount, slippagePercentage, sampler, marketOperationUtils, swapQuoteCalculator, swapQuote;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assetSellAmount = utils_2.baseUnitAmount(3);
                        slippagePercentage = 0.5;
                        sampler = createSamplerFromSignedOrdersWithFillableAmounts(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET);
                        marketOperationUtils = new market_operation_utils_1.MarketOperationUtils(sampler, contractAddresses, {
                            exchangeAddress: contractAddresses.exchange,
                            chainId: TESTRPC_CHAIN_ID,
                        });
                        swapQuoteCalculator = new swap_quote_calculator_1.SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
                        return [4 /*yield*/, swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET, assetSellAmount, slippagePercentage, GAS_PRICE, CALCULATE_SWAP_QUOTE_OPTS)];
                    case 1:
                        swapQuote = _a.sent();
                        // test if orders are correct
                        expect(swapQuote.orders).to.deep.equal([
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET[0],
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET[2],
                        ]);
                        expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
                        // test if rates are correct
                        expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(2.25),
                            takerAssetAmount: assetSellAmount.minus(utils_2.baseUnitAmount(2.25)),
                            totalTakerAssetAmount: assetSellAmount,
                            makerAssetAmount: utils_2.baseUnitAmount(4.5),
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(15, 4),
                        });
                        expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(1.2),
                            takerAssetAmount: assetSellAmount.minus(utils_2.baseUnitAmount(1.2)),
                            totalTakerAssetAmount: assetSellAmount,
                            makerAssetAmount: utils_2.baseUnitAmount(1.8),
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(30, 4),
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('calculates a correct swapQuote with no slippage (makerAsset denominated fee orders)', function () { return __awaiter(_this, void 0, void 0, function () {
            var assetSellAmount, slippagePercentage, sampler, marketOperationUtils, swapQuoteCalculator, swapQuote;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assetSellAmount = utils_2.baseUnitAmount(4);
                        slippagePercentage = 0;
                        sampler = createSamplerFromSignedOrdersWithFillableAmounts(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET);
                        marketOperationUtils = new market_operation_utils_1.MarketOperationUtils(sampler, contractAddresses, {
                            exchangeAddress: contractAddresses.exchange,
                            chainId: TESTRPC_CHAIN_ID,
                        });
                        swapQuoteCalculator = new swap_quote_calculator_1.SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
                        return [4 /*yield*/, swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET, assetSellAmount, slippagePercentage, GAS_PRICE, CALCULATE_SWAP_QUOTE_OPTS)];
                    case 1:
                        swapQuote = _a.sent();
                        // test if orders are correct
                        expect(swapQuote.orders).to.deep.equal([
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET[1],
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET[2],
                        ]);
                        expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
                        // test if rates are correct
                        expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(1.5).minus(1),
                            takerAssetAmount: assetSellAmount.minus(utils_2.baseUnitAmount(1.5)).plus(1),
                            totalTakerAssetAmount: assetSellAmount,
                            makerAssetAmount: utils_2.baseUnitAmount(4),
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(30, 4),
                        });
                        expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(1.5).minus(1),
                            takerAssetAmount: assetSellAmount.minus(utils_2.baseUnitAmount(1.5)).plus(1),
                            totalTakerAssetAmount: assetSellAmount,
                            makerAssetAmount: utils_2.baseUnitAmount(4),
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(30, 4),
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('calculates a correct swapQuote with slippage (makerAsset denominated fee orders)', function () { return __awaiter(_this, void 0, void 0, function () {
            var assetSellAmount, slippagePercentage, sampler, marketOperationUtils, swapQuoteCalculator, swapQuote;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assetSellAmount = utils_2.baseUnitAmount(4);
                        slippagePercentage = 0.5;
                        sampler = createSamplerFromSignedOrdersWithFillableAmounts(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET);
                        marketOperationUtils = new market_operation_utils_1.MarketOperationUtils(sampler, contractAddresses, {
                            exchangeAddress: contractAddresses.exchange,
                            chainId: TESTRPC_CHAIN_ID,
                        });
                        swapQuoteCalculator = new swap_quote_calculator_1.SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
                        return [4 /*yield*/, swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET, assetSellAmount, slippagePercentage, GAS_PRICE, CALCULATE_SWAP_QUOTE_OPTS)];
                    case 1:
                        swapQuote = _a.sent();
                        // test if orders are correct
                        expect(swapQuote.orders).to.deep.equal([
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET[1],
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET[2],
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET[0],
                        ]);
                        expect(swapQuote.takerAssetFillAmount).to.bignumber.equal(assetSellAmount);
                        // test if rates are correct
                        expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(1.5).minus(1),
                            takerAssetAmount: assetSellAmount.minus(utils_2.baseUnitAmount(1.5)).plus(1),
                            totalTakerAssetAmount: assetSellAmount,
                            makerAssetAmount: utils_2.baseUnitAmount(4),
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(30, 4),
                        });
                        expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(2),
                            takerAssetAmount: assetSellAmount.minus(utils_2.baseUnitAmount(2)),
                            totalTakerAssetAmount: assetSellAmount,
                            makerAssetAmount: utils_2.baseUnitAmount(0.8),
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(45, 4),
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#calculateMarketBuySwapQuoteAsync', function () {
        // TODO(dave4506) InsufficientLiquidityError is not thrown anymore, consider how to test for insufficient liquidity
        // describe('InsufficientLiquidityError', () => {
        //     it('should throw if not enough maker asset liquidity (multiple feeless orders)', async () => {
        //         const sampler = createSamplerFromSignedOrdersWithFillableAmounts(testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS);
        //         const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, {
        //             exchangeAddress: contractAddresses.exchange,
        //             chainId: TESTRPC_CHAIN_ID,
        //         });
        //         const swapQuoteCalculator = new SwapQuoteCalculator( protocolFeeUtils, marketOperationUtils);
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
        //         const swapQuoteCalculator = new SwapQuoteCalculator( protocolFeeUtils, marketOperationUtils);
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
        //         const swapQuoteCalculator = new SwapQuoteCalculator( protocolFeeUtils, marketOperationUtils);
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
        //         const swapQuoteCalculator = new SwapQuoteCalculator( protocolFeeUtils, marketOperationUtils);
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
        //         const swapQuoteCalculator = new SwapQuoteCalculator( protocolFeeUtils, marketOperationUtils);
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
        //         const swapQuoteCalculator = new SwapQuoteCalculator( protocolFeeUtils, marketOperationUtils);
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
        //         const swapQuoteCalculator = new SwapQuoteCalculator( protocolFeeUtils, marketOperationUtils);
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
        //         const swapQuoteCalculator = new SwapQuoteCalculator( protocolFeeUtils, marketOperationUtils);
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
        it('calculates a correct swapQuote with no slippage (feeless orders)', function () { return __awaiter(_this, void 0, void 0, function () {
            var assetBuyAmount, slippagePercentage, sampler, marketOperationUtils, swapQuoteCalculator, swapQuote;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assetBuyAmount = utils_2.baseUnitAmount(3);
                        slippagePercentage = 0;
                        sampler = createSamplerFromSignedOrdersWithFillableAmounts(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS);
                        marketOperationUtils = new market_operation_utils_1.MarketOperationUtils(sampler, contractAddresses, {
                            exchangeAddress: contractAddresses.exchange,
                            chainId: TESTRPC_CHAIN_ID,
                        });
                        swapQuoteCalculator = new swap_quote_calculator_1.SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
                        return [4 /*yield*/, swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS, assetBuyAmount, slippagePercentage, GAS_PRICE, CALCULATE_SWAP_QUOTE_OPTS)];
                    case 1:
                        swapQuote = _a.sent();
                        // test if orders are correct
                        expect(swapQuote.orders).to.deep.equal([test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS[0]]);
                        expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);
                        // test if rates are correct
                        expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(0),
                            takerAssetAmount: utils_2.baseUnitAmount(0.5),
                            totalTakerAssetAmount: utils_2.baseUnitAmount(0.5),
                            makerAssetAmount: assetBuyAmount,
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(15, 4),
                        });
                        expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(0),
                            takerAssetAmount: utils_2.baseUnitAmount(0.5),
                            totalTakerAssetAmount: utils_2.baseUnitAmount(0.5),
                            makerAssetAmount: assetBuyAmount,
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(15, 4),
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('calculates a correct swapQuote with slippage (feeless orders)', function () { return __awaiter(_this, void 0, void 0, function () {
            var assetBuyAmount, slippagePercentage, sampler, marketOperationUtils, swapQuoteCalculator, swapQuote, takerAssetAmount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assetBuyAmount = utils_2.baseUnitAmount(5);
                        slippagePercentage = 0.5;
                        sampler = createSamplerFromSignedOrdersWithFillableAmounts(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS);
                        marketOperationUtils = new market_operation_utils_1.MarketOperationUtils(sampler, contractAddresses, {
                            exchangeAddress: contractAddresses.exchange,
                            chainId: TESTRPC_CHAIN_ID,
                        });
                        swapQuoteCalculator = new swap_quote_calculator_1.SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
                        return [4 /*yield*/, swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS, assetBuyAmount, slippagePercentage, GAS_PRICE, CALCULATE_SWAP_QUOTE_OPTS)];
                    case 1:
                        swapQuote = _a.sent();
                        // test if orders are correct
                        expect(swapQuote.orders).to.deep.equal([
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS[0],
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS[2],
                        ]);
                        expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);
                        takerAssetAmount = new utils_1.BigNumber(5)
                            .div(new utils_1.BigNumber(6))
                            .multipliedBy(ONE_ETH_IN_WEI)
                            .integerValue(utils_1.BigNumber.ROUND_CEIL);
                        // test if rates are correct
                        expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(0),
                            takerAssetAmount: takerAssetAmount,
                            totalTakerAssetAmount: takerAssetAmount,
                            makerAssetAmount: assetBuyAmount,
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(15, 4),
                        });
                        expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(0),
                            takerAssetAmount: utils_2.baseUnitAmount(20)
                                .div(6)
                                .integerValue(utils_1.BigNumber.ROUND_UP),
                            totalTakerAssetAmount: utils_2.baseUnitAmount(20)
                                .div(6)
                                .integerValue(utils_1.BigNumber.ROUND_UP),
                            makerAssetAmount: assetBuyAmount,
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(30, 4),
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('calculates a correct swapQuote with no slippage (takerAsset denominated fee orders)', function () { return __awaiter(_this, void 0, void 0, function () {
            var assetBuyAmount, slippagePercentage, sampler, marketOperationUtils, swapQuoteCalculator, swapQuote;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assetBuyAmount = utils_2.baseUnitAmount(3);
                        slippagePercentage = 0;
                        sampler = createSamplerFromSignedOrdersWithFillableAmounts(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET);
                        marketOperationUtils = new market_operation_utils_1.MarketOperationUtils(sampler, contractAddresses, {
                            exchangeAddress: contractAddresses.exchange,
                            chainId: TESTRPC_CHAIN_ID,
                        });
                        swapQuoteCalculator = new swap_quote_calculator_1.SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
                        return [4 /*yield*/, swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET, assetBuyAmount, slippagePercentage, GAS_PRICE, CALCULATE_SWAP_QUOTE_OPTS)];
                    case 1:
                        swapQuote = _a.sent();
                        // test if orders are correct
                        expect(swapQuote.orders).to.deep.equal([
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET[0],
                        ]);
                        expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);
                        // test if rates are correct
                        expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(1.5),
                            takerAssetAmount: utils_2.baseUnitAmount(0.5),
                            totalTakerAssetAmount: utils_2.baseUnitAmount(2),
                            makerAssetAmount: assetBuyAmount,
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(15, 4),
                        });
                        expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(1.5),
                            takerAssetAmount: utils_2.baseUnitAmount(0.5),
                            totalTakerAssetAmount: utils_2.baseUnitAmount(2),
                            makerAssetAmount: assetBuyAmount,
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(15, 4),
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('calculates a correct swapQuote with slippage (takerAsset denominated fee orders)', function () { return __awaiter(_this, void 0, void 0, function () {
            var assetBuyAmount, slippagePercentage, sampler, marketOperationUtils, swapQuoteCalculator, swapQuote, fiveSixthEthInWei;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assetBuyAmount = utils_2.baseUnitAmount(5);
                        slippagePercentage = 0.5;
                        sampler = createSamplerFromSignedOrdersWithFillableAmounts(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET);
                        marketOperationUtils = new market_operation_utils_1.MarketOperationUtils(sampler, contractAddresses, {
                            exchangeAddress: contractAddresses.exchange,
                            chainId: TESTRPC_CHAIN_ID,
                        });
                        swapQuoteCalculator = new swap_quote_calculator_1.SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
                        return [4 /*yield*/, swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET, assetBuyAmount, slippagePercentage, GAS_PRICE, CALCULATE_SWAP_QUOTE_OPTS)];
                    case 1:
                        swapQuote = _a.sent();
                        fiveSixthEthInWei = new utils_1.BigNumber(5)
                            .div(new utils_1.BigNumber(6))
                            .multipliedBy(ONE_ETH_IN_WEI)
                            .integerValue(utils_1.BigNumber.ROUND_CEIL);
                        // test if orders are correct
                        expect(swapQuote.orders).to.deep.equal([
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET[0],
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET[2],
                        ]);
                        expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);
                        // test if rates are correct
                        expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(2.5),
                            takerAssetAmount: fiveSixthEthInWei,
                            totalTakerAssetAmount: utils_2.baseUnitAmount(2.5).plus(fiveSixthEthInWei),
                            makerAssetAmount: assetBuyAmount,
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(15, 4),
                        });
                        expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(3),
                            takerAssetAmount: utils_2.baseUnitAmount(10)
                                .div(3)
                                .integerValue(utils_1.BigNumber.ROUND_UP),
                            totalTakerAssetAmount: utils_2.baseUnitAmount(19)
                                .div(3)
                                .integerValue(utils_1.BigNumber.ROUND_UP),
                            makerAssetAmount: assetBuyAmount,
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(30, 4),
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('calculates a correct swapQuote with no slippage (makerAsset denominated fee orders)', function () { return __awaiter(_this, void 0, void 0, function () {
            var assetBuyAmount, slippagePercentage, sampler, marketOperationUtils, swapQuoteCalculator, swapQuote;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assetBuyAmount = utils_2.baseUnitAmount(1);
                        slippagePercentage = 0;
                        sampler = createSamplerFromSignedOrdersWithFillableAmounts(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET);
                        marketOperationUtils = new market_operation_utils_1.MarketOperationUtils(sampler, contractAddresses, {
                            exchangeAddress: contractAddresses.exchange,
                            chainId: TESTRPC_CHAIN_ID,
                        });
                        swapQuoteCalculator = new swap_quote_calculator_1.SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
                        return [4 /*yield*/, swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET, assetBuyAmount, slippagePercentage, GAS_PRICE, CALCULATE_SWAP_QUOTE_OPTS)];
                    case 1:
                        swapQuote = _a.sent();
                        // test if orders are correct
                        expect(swapQuote.orders).to.deep.equal([
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET[1],
                        ]);
                        expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);
                        // test if rates are correct
                        expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(0.5)
                                .div(3)
                                .integerValue(utils_1.BigNumber.ROUND_UP),
                            takerAssetAmount: utils_2.baseUnitAmount(0.5)
                                .div(3)
                                .integerValue(utils_1.BigNumber.ROUND_UP),
                            totalTakerAssetAmount: utils_2.baseUnitAmount(1)
                                .div(3)
                                .integerValue(utils_1.BigNumber.ROUND_UP),
                            makerAssetAmount: assetBuyAmount,
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(15, 4),
                        });
                        expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(0.5)
                                .div(3)
                                .integerValue(utils_1.BigNumber.ROUND_UP),
                            takerAssetAmount: utils_2.baseUnitAmount(0.5)
                                .div(3)
                                .integerValue(utils_1.BigNumber.ROUND_UP),
                            totalTakerAssetAmount: utils_2.baseUnitAmount(1)
                                .div(3)
                                .integerValue(utils_1.BigNumber.ROUND_UP),
                            makerAssetAmount: assetBuyAmount,
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(15, 4),
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('calculates a correct swapQuote with slippage (makerAsset denominated fee orders)', function () { return __awaiter(_this, void 0, void 0, function () {
            var assetBuyAmount, slippagePercentage, sampler, marketOperationUtils, swapQuoteCalculator, swapQuote, oneThirdEthInWei, oneSixthEthInWei;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assetBuyAmount = utils_2.baseUnitAmount(2.5);
                        slippagePercentage = 0.48;
                        sampler = createSamplerFromSignedOrdersWithFillableAmounts(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET);
                        marketOperationUtils = new market_operation_utils_1.MarketOperationUtils(sampler, contractAddresses, {
                            exchangeAddress: contractAddresses.exchange,
                            chainId: TESTRPC_CHAIN_ID,
                        });
                        swapQuoteCalculator = new swap_quote_calculator_1.SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils);
                        return [4 /*yield*/, swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET, assetBuyAmount, slippagePercentage, GAS_PRICE, CALCULATE_SWAP_QUOTE_OPTS)];
                    case 1:
                        swapQuote = _a.sent();
                        // test if orders are correct
                        expect(swapQuote.orders).to.deep.equal([
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET[1],
                            test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET[2],
                        ]);
                        expect(swapQuote.makerAssetFillAmount).to.bignumber.equal(assetBuyAmount);
                        // test if rates are correct
                        expect(swapQuote.worstCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(1.25).minus(1),
                            takerAssetAmount: utils_2.baseUnitAmount(2.25).plus(1),
                            totalTakerAssetAmount: utils_2.baseUnitAmount(3.5),
                            makerAssetAmount: assetBuyAmount,
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(30, 4),
                        });
                        oneThirdEthInWei = new utils_1.BigNumber(1)
                            .div(new utils_1.BigNumber(3))
                            .multipliedBy(ONE_ETH_IN_WEI)
                            .integerValue(utils_1.BigNumber.ROUND_CEIL);
                        oneSixthEthInWei = new utils_1.BigNumber(1)
                            .div(new utils_1.BigNumber(6))
                            .multipliedBy(ONE_ETH_IN_WEI)
                            .integerValue(utils_1.BigNumber.ROUND_CEIL);
                        expect(swapQuote.bestCaseQuoteInfo).to.deep.equal({
                            feeTakerAssetAmount: utils_2.baseUnitAmount(4)
                                .plus(oneSixthEthInWei)
                                .multipliedBy(0.1)
                                .integerValue(utils_1.BigNumber.ROUND_CEIL),
                            takerAssetAmount: utils_2.baseUnitAmount(4)
                                .plus(oneSixthEthInWei)
                                .multipliedBy(0.1)
                                .integerValue(utils_1.BigNumber.ROUND_CEIL),
                            totalTakerAssetAmount: utils_2.baseUnitAmount(8)
                                .plus(oneThirdEthInWei)
                                .multipliedBy(0.1)
                                .integerValue(utils_1.BigNumber.ROUND_CEIL),
                            makerAssetAmount: assetBuyAmount,
                            protocolFeeInWeiAmount: utils_2.baseUnitAmount(15, 4),
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=swap_quote_calculator_test.js.map