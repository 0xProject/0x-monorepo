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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var contract_addresses_1 = require("@0x/contract-addresses");
var contracts_test_utils_1 = require("@0x/contracts-test-utils");
var order_utils_1 = require("@0x/order-utils");
var utils_1 = require("@0x/utils");
var _ = require("lodash");
var constants_1 = require("../src/constants");
var market_operation_utils_1 = require("../src/utils/market_operation_utils/");
var constants_2 = require("../src/utils/market_operation_utils/constants");
var sampler_1 = require("../src/utils/market_operation_utils/sampler");
var types_1 = require("../src/utils/market_operation_utils/types");
var BUY_SOURCES = constants_2.constants.BUY_SOURCES, SELL_SOURCES = constants_2.constants.SELL_SOURCES;
// tslint:disable: custom-no-magic-numbers
describe('MarketOperationUtils tests', function () {
    var _a;
    var CHAIN_ID = 1;
    var contractAddresses = contract_addresses_1.getContractAddressesForChainOrThrow(CHAIN_ID);
    var ETH2DAI_BRIDGE_ADDRESS = contractAddresses.eth2DaiBridge;
    var KYBER_BRIDGE_ADDRESS = contractAddresses.kyberBridge;
    var UNISWAP_BRIDGE_ADDRESS = contractAddresses.uniswapBridge;
    var CURVE_BRIDGE_ADDRESS = contractAddresses.curveBridge;
    var MAKER_TOKEN = contracts_test_utils_1.randomAddress();
    var TAKER_TOKEN = contracts_test_utils_1.randomAddress();
    var MAKER_ASSET_DATA = order_utils_1.assetDataUtils.encodeERC20AssetData(MAKER_TOKEN);
    var TAKER_ASSET_DATA = order_utils_1.assetDataUtils.encodeERC20AssetData(TAKER_TOKEN);
    var originalSamplerOperations;
    before(function () {
        originalSamplerOperations = sampler_1.DexOrderSampler.ops;
    });
    after(function () {
        sampler_1.DexOrderSampler.ops = originalSamplerOperations;
    });
    function createOrder(overrides) {
        return __assign({ chainId: CHAIN_ID, exchangeAddress: contractAddresses.exchange, makerAddress: contracts_test_utils_1.constants.NULL_ADDRESS, takerAddress: contracts_test_utils_1.constants.NULL_ADDRESS, senderAddress: contracts_test_utils_1.constants.NULL_ADDRESS, feeRecipientAddress: contracts_test_utils_1.randomAddress(), salt: order_utils_1.generatePseudoRandomSalt(), expirationTimeSeconds: contracts_test_utils_1.getRandomInteger(0, Math.pow(2, 64)), makerAssetData: MAKER_ASSET_DATA, takerAssetData: TAKER_ASSET_DATA, makerFeeAssetData: contracts_test_utils_1.constants.NULL_BYTES, takerFeeAssetData: contracts_test_utils_1.constants.NULL_BYTES, makerAssetAmount: contracts_test_utils_1.getRandomInteger(1, 1e18), takerAssetAmount: contracts_test_utils_1.getRandomInteger(1, 1e18), makerFee: contracts_test_utils_1.constants.ZERO_AMOUNT, takerFee: contracts_test_utils_1.constants.ZERO_AMOUNT, signature: utils_1.hexUtils.random() }, overrides);
    }
    function getSourceFromAssetData(assetData) {
        if (assetData.length === 74) {
            return types_1.ERC20BridgeSource.Native;
        }
        var bridgeAddress = utils_1.hexUtils.slice(assetData, 48, 68).toLowerCase();
        switch (bridgeAddress) {
            case KYBER_BRIDGE_ADDRESS.toLowerCase():
                return types_1.ERC20BridgeSource.Kyber;
            case ETH2DAI_BRIDGE_ADDRESS.toLowerCase():
                return types_1.ERC20BridgeSource.Eth2Dai;
            case UNISWAP_BRIDGE_ADDRESS.toLowerCase():
                return types_1.ERC20BridgeSource.Uniswap;
            case CURVE_BRIDGE_ADDRESS.toLowerCase():
                var curveSource = Object.keys(constants_1.constants.DEFAULT_CURVE_OPTS).filter(function (k) { return assetData.indexOf(constants_1.constants.DEFAULT_CURVE_OPTS[k].curveAddress.slice(2)) !== -1; });
                return curveSource[0];
            default:
                break;
        }
        throw new Error("Unknown bridge address: " + bridgeAddress);
    }
    function assertSamePrefix(actual, expected) {
        contracts_test_utils_1.expect(actual.substr(0, expected.length)).to.eq(expected);
    }
    function createOrdersFromSellRates(takerAssetAmount, rates) {
        var singleTakerAssetAmount = takerAssetAmount.div(rates.length).integerValue(utils_1.BigNumber.ROUND_UP);
        return rates.map(function (r) {
            return createOrder({
                makerAssetAmount: singleTakerAssetAmount.times(r).integerValue(),
                takerAssetAmount: singleTakerAssetAmount,
            });
        });
    }
    function createOrdersFromBuyRates(makerAssetAmount, rates) {
        var singleMakerAssetAmount = makerAssetAmount.div(rates.length).integerValue(utils_1.BigNumber.ROUND_UP);
        return rates.map(function (r) {
            return createOrder({
                makerAssetAmount: singleMakerAssetAmount,
                takerAssetAmount: singleMakerAssetAmount.div(r).integerValue(),
            });
        });
    }
    var ORDER_DOMAIN = {
        exchangeAddress: contractAddresses.exchange,
        chainId: CHAIN_ID,
    };
    function createGetSellQuotesOperationFromRates(rates) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var fillAmounts = args.pop();
            return fillAmounts.map(function (a, i) { return a.times(rates[i]).integerValue(); });
        };
    }
    function createGetBuyQuotesOperationFromRates(rates) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var fillAmounts = args.pop();
            return fillAmounts.map(function (a, i) { return a.div(rates[i]).integerValue(); });
        };
    }
    function createGetMultipleSellQuotesOperationFromRates(rates) {
        return function (sources, makerToken, takerToken, fillAmounts) {
            return sources.map(function (s) {
                return fillAmounts.map(function (a, i) { return ({
                    source: s,
                    input: a,
                    output: a.times(rates[s][i]).integerValue(),
                }); });
            });
        };
    }
    function createGetMultipleBuyQuotesOperationFromRates(rates) {
        return function (sources, makerToken, takerToken, fillAmounts) {
            return sources.map(function (s) {
                return fillAmounts.map(function (a, i) { return ({
                    source: s,
                    input: a,
                    output: a.div(rates[s][i]).integerValue(),
                }); });
            });
        };
    }
    function createGetMedianSellRate(rate) {
        return function (sources, makerToken, takerToken, fillAmounts) {
            return new utils_1.BigNumber(rate);
        };
    }
    function createDecreasingRates(count) {
        var rates = [];
        var initialRate = contracts_test_utils_1.getRandomFloat(1e-3, 1e2);
        _.times(count, function () { return contracts_test_utils_1.getRandomFloat(0.95, 1); }).forEach(function (r, i) {
            var prevRate = i === 0 ? initialRate : rates[i - 1];
            rates.push(prevRate.times(r));
        });
        return rates;
    }
    var NUM_SAMPLES = 3;
    var DEFAULT_RATES = (_a = {},
        _a[types_1.ERC20BridgeSource.Native] = createDecreasingRates(NUM_SAMPLES),
        _a[types_1.ERC20BridgeSource.Eth2Dai] = createDecreasingRates(NUM_SAMPLES),
        _a[types_1.ERC20BridgeSource.Kyber] = createDecreasingRates(NUM_SAMPLES),
        _a[types_1.ERC20BridgeSource.Uniswap] = createDecreasingRates(NUM_SAMPLES),
        _a[types_1.ERC20BridgeSource.CurveUsdcDai] = _.times(NUM_SAMPLES, function () { return 0; }),
        _a[types_1.ERC20BridgeSource.CurveUsdcDaiUsdt] = _.times(NUM_SAMPLES, function () { return 0; }),
        _a[types_1.ERC20BridgeSource.CurveUsdcDaiUsdtTusd] = _.times(NUM_SAMPLES, function () { return 0; }),
        _a);
    function findSourceWithMaxOutput(rates) {
        var minSourceRates = Object.keys(rates).map(function (s) { return _.last(rates[s]); });
        var bestSourceRate = utils_1.BigNumber.max.apply(utils_1.BigNumber, __spread(minSourceRates));
        var source = Object.keys(rates)[_.findIndex(minSourceRates, function (t) { return bestSourceRate.eq(t); })];
        // Native order rates play by different rules.
        if (source !== types_1.ERC20BridgeSource.Native) {
            var nativeTotalRate = utils_1.BigNumber.sum.apply(utils_1.BigNumber, __spread(rates[types_1.ERC20BridgeSource.Native])).div(rates[types_1.ERC20BridgeSource.Native].length);
            if (nativeTotalRate.gt(bestSourceRate)) {
                source = types_1.ERC20BridgeSource.Native;
            }
        }
        return source;
    }
    var DEFAULT_OPS = {
        getOrderFillableTakerAmounts: function (orders) {
            return orders.map(function (o) { return o.takerAssetAmount; });
        },
        getOrderFillableMakerAmounts: function (orders) {
            return orders.map(function (o) { return o.makerAssetAmount; });
        },
        getKyberSellQuotes: createGetSellQuotesOperationFromRates(DEFAULT_RATES[types_1.ERC20BridgeSource.Kyber]),
        getUniswapSellQuotes: createGetSellQuotesOperationFromRates(DEFAULT_RATES[types_1.ERC20BridgeSource.Uniswap]),
        getEth2DaiSellQuotes: createGetSellQuotesOperationFromRates(DEFAULT_RATES[types_1.ERC20BridgeSource.Eth2Dai]),
        getUniswapBuyQuotes: createGetBuyQuotesOperationFromRates(DEFAULT_RATES[types_1.ERC20BridgeSource.Uniswap]),
        getEth2DaiBuyQuotes: createGetBuyQuotesOperationFromRates(DEFAULT_RATES[types_1.ERC20BridgeSource.Eth2Dai]),
        getCurveSellQuotes: createGetSellQuotesOperationFromRates(DEFAULT_RATES[types_1.ERC20BridgeSource.CurveUsdcDai]),
        getSellQuotes: createGetMultipleSellQuotesOperationFromRates(DEFAULT_RATES),
        getBuyQuotes: createGetMultipleBuyQuotesOperationFromRates(DEFAULT_RATES),
        getMedianSellRate: createGetMedianSellRate(1),
    };
    function replaceSamplerOps(ops) {
        if (ops === void 0) { ops = {}; }
        sampler_1.DexOrderSampler.ops = __assign({}, DEFAULT_OPS, ops);
    }
    var MOCK_SAMPLER = {
        executeAsync: function () {
            var ops = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                ops[_i] = arguments[_i];
            }
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, ops];
                });
            });
        },
        executeBatchAsync: function (ops) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, ops];
                });
            });
        },
    };
    describe('MarketOperationUtils', function () {
        var marketOperationUtils;
        before(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                marketOperationUtils = new market_operation_utils_1.MarketOperationUtils(MOCK_SAMPLER, contractAddresses, ORDER_DOMAIN);
                return [2 /*return*/];
            });
        }); });
        describe('getMarketSellOrdersAsync()', function () {
            var FILL_AMOUNT = contracts_test_utils_1.getRandomInteger(1, 1e18);
            var ORDERS = createOrdersFromSellRates(FILL_AMOUNT, _.times(NUM_SAMPLES, function (i) { return DEFAULT_RATES[types_1.ERC20BridgeSource.Native][i]; }));
            var DEFAULT_OPTS = {
                numSamples: NUM_SAMPLES,
                runLimit: 0,
                sampleDistributionBase: 1,
                bridgeSlippage: 0,
                excludedSources: [
                    types_1.ERC20BridgeSource.CurveUsdcDai,
                    types_1.ERC20BridgeSource.CurveUsdcDaiUsdt,
                    types_1.ERC20BridgeSource.CurveUsdcDaiUsdtTusd,
                ],
            };
            beforeEach(function () {
                replaceSamplerOps();
            });
            it('queries `numSamples` samples', function () { return __awaiter(_this, void 0, void 0, function () {
                var numSamples, actualNumSamples;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            numSamples = _.random(1, 16);
                            actualNumSamples = 0;
                            replaceSamplerOps({
                                getSellQuotes: function (sources, makerToken, takerToken, amounts) {
                                    actualNumSamples = amounts.length;
                                    return DEFAULT_OPS.getSellQuotes(sources, makerToken, takerToken, amounts);
                                },
                            });
                            return [4 /*yield*/, marketOperationUtils.getMarketSellOrdersAsync(ORDERS, FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { numSamples: numSamples }))];
                        case 1:
                            _a.sent();
                            contracts_test_utils_1.expect(actualNumSamples).eq(numSamples);
                            return [2 /*return*/];
                    }
                });
            }); });
            it('polls all DEXes if `excludedSources` is empty', function () { return __awaiter(_this, void 0, void 0, function () {
                var sourcesPolled;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            sourcesPolled = [];
                            replaceSamplerOps({
                                getSellQuotes: function (sources, makerToken, takerToken, amounts) {
                                    sourcesPolled = sources.slice();
                                    return DEFAULT_OPS.getSellQuotes(sources, makerToken, takerToken, amounts);
                                },
                            });
                            return [4 /*yield*/, marketOperationUtils.getMarketSellOrdersAsync(ORDERS, FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { excludedSources: [] }))];
                        case 1:
                            _a.sent();
                            contracts_test_utils_1.expect(sourcesPolled.sort()).to.deep.eq(SELL_SOURCES.slice().sort());
                            return [2 /*return*/];
                    }
                });
            }); });
            it('does not poll DEXes in `excludedSources`', function () { return __awaiter(_this, void 0, void 0, function () {
                var excludedSources, sourcesPolled;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            excludedSources = _.sampleSize(SELL_SOURCES, _.random(1, SELL_SOURCES.length));
                            sourcesPolled = [];
                            replaceSamplerOps({
                                getSellQuotes: function (sources, makerToken, takerToken, amounts) {
                                    sourcesPolled = sources.slice();
                                    return DEFAULT_OPS.getSellQuotes(sources, makerToken, takerToken, amounts);
                                },
                            });
                            return [4 /*yield*/, marketOperationUtils.getMarketSellOrdersAsync(ORDERS, FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { excludedSources: excludedSources }))];
                        case 1:
                            _a.sent();
                            contracts_test_utils_1.expect(sourcesPolled.sort()).to.deep.eq(_.without.apply(_, __spread([SELL_SOURCES], excludedSources)).sort());
                            return [2 /*return*/];
                    }
                });
            }); });
            it('returns the most cost-effective single source if `runLimit == 0`', function () { return __awaiter(_this, void 0, void 0, function () {
                var bestSource, improvedOrders, uniqueAssetDatas;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            bestSource = findSourceWithMaxOutput(DEFAULT_RATES);
                            contracts_test_utils_1.expect(bestSource).to.exist('');
                            return [4 /*yield*/, marketOperationUtils.getMarketSellOrdersAsync(ORDERS, FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { runLimit: 0 }))];
                        case 1:
                            improvedOrders = _a.sent();
                            uniqueAssetDatas = _.uniq(improvedOrders.map(function (o) { return o.makerAssetData; }));
                            contracts_test_utils_1.expect(uniqueAssetDatas).to.be.length(1);
                            contracts_test_utils_1.expect(getSourceFromAssetData(uniqueAssetDatas[0])).to.be.eq(bestSource);
                            return [2 /*return*/];
                    }
                });
            }); });
            it('generates bridge orders with correct asset data', function () { return __awaiter(_this, void 0, void 0, function () {
                var e_1, _a, improvedOrders, improvedOrders_1, improvedOrders_1_1, order, makerAssetDataPrefix;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, marketOperationUtils.getMarketSellOrdersAsync(
                            // Pass in empty orders to prevent native orders from being used.
                            ORDERS.map(function (o) { return (__assign({}, o, { makerAssetAmount: contracts_test_utils_1.constants.ZERO_AMOUNT })); }), FILL_AMOUNT, DEFAULT_OPTS)];
                        case 1:
                            improvedOrders = _b.sent();
                            contracts_test_utils_1.expect(improvedOrders).to.not.be.length(0);
                            try {
                                for (improvedOrders_1 = __values(improvedOrders), improvedOrders_1_1 = improvedOrders_1.next(); !improvedOrders_1_1.done; improvedOrders_1_1 = improvedOrders_1.next()) {
                                    order = improvedOrders_1_1.value;
                                    contracts_test_utils_1.expect(getSourceFromAssetData(order.makerAssetData)).to.exist('');
                                    makerAssetDataPrefix = utils_1.hexUtils.slice(order_utils_1.assetDataUtils.encodeERC20BridgeAssetData(MAKER_TOKEN, contracts_test_utils_1.constants.NULL_ADDRESS, contracts_test_utils_1.constants.NULL_BYTES), 0, 36);
                                    assertSamePrefix(order.makerAssetData, makerAssetDataPrefix);
                                    contracts_test_utils_1.expect(order.takerAssetData).to.eq(TAKER_ASSET_DATA);
                                }
                            }
                            catch (e_1_1) { e_1 = { error: e_1_1 }; }
                            finally {
                                try {
                                    if (improvedOrders_1_1 && !improvedOrders_1_1.done && (_a = improvedOrders_1.return)) _a.call(improvedOrders_1);
                                }
                                finally { if (e_1) throw e_1.error; }
                            }
                            return [2 /*return*/];
                    }
                });
            }); });
            it('generates bridge orders with correct taker amount', function () { return __awaiter(_this, void 0, void 0, function () {
                var improvedOrders, totalTakerAssetAmount;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, marketOperationUtils.getMarketSellOrdersAsync(
                            // Pass in empty orders to prevent native orders from being used.
                            ORDERS.map(function (o) { return (__assign({}, o, { makerAssetAmount: contracts_test_utils_1.constants.ZERO_AMOUNT })); }), FILL_AMOUNT, DEFAULT_OPTS)];
                        case 1:
                            improvedOrders = _a.sent();
                            totalTakerAssetAmount = utils_1.BigNumber.sum.apply(utils_1.BigNumber, __spread(improvedOrders.map(function (o) { return o.takerAssetAmount; })));
                            contracts_test_utils_1.expect(totalTakerAssetAmount).to.bignumber.gte(FILL_AMOUNT);
                            return [2 /*return*/];
                    }
                });
            }); });
            it('generates bridge orders with max slippage of `bridgeSlippage`', function () { return __awaiter(_this, void 0, void 0, function () {
                var e_2, _a, bridgeSlippage, improvedOrders, improvedOrders_2, improvedOrders_2_1, order, source, expectedMakerAmount, slippage;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            bridgeSlippage = _.random(0.1, true);
                            return [4 /*yield*/, marketOperationUtils.getMarketSellOrdersAsync(
                                // Pass in empty orders to prevent native orders from being used.
                                ORDERS.map(function (o) { return (__assign({}, o, { makerAssetAmount: contracts_test_utils_1.constants.ZERO_AMOUNT })); }), FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { bridgeSlippage: bridgeSlippage }))];
                        case 1:
                            improvedOrders = _b.sent();
                            contracts_test_utils_1.expect(improvedOrders).to.not.be.length(0);
                            try {
                                for (improvedOrders_2 = __values(improvedOrders), improvedOrders_2_1 = improvedOrders_2.next(); !improvedOrders_2_1.done; improvedOrders_2_1 = improvedOrders_2.next()) {
                                    order = improvedOrders_2_1.value;
                                    source = getSourceFromAssetData(order.makerAssetData);
                                    expectedMakerAmount = FILL_AMOUNT.times(_.last(DEFAULT_RATES[source]));
                                    slippage = 1 - order.makerAssetAmount.div(expectedMakerAmount.plus(1)).toNumber();
                                    contracts_test_utils_1.assertRoughlyEquals(slippage, bridgeSlippage, 8);
                                }
                            }
                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                            finally {
                                try {
                                    if (improvedOrders_2_1 && !improvedOrders_2_1.done && (_a = improvedOrders_2.return)) _a.call(improvedOrders_2);
                                }
                                finally { if (e_2) throw e_2.error; }
                            }
                            return [2 /*return*/];
                    }
                });
            }); });
            it('can mix convex sources', function () { return __awaiter(_this, void 0, void 0, function () {
                var rates, improvedOrders, orderSources, expectedSources;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            rates = {};
                            rates[types_1.ERC20BridgeSource.Native] = [0.4, 0.3, 0.2, 0.1];
                            rates[types_1.ERC20BridgeSource.Uniswap] = [0.5, 0.05, 0.05, 0.05];
                            rates[types_1.ERC20BridgeSource.Eth2Dai] = [0.6, 0.05, 0.05, 0.05];
                            rates[types_1.ERC20BridgeSource.Kyber] = [0.7, 0.05, 0.05, 0.05];
                            replaceSamplerOps({
                                getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                            });
                            return [4 /*yield*/, marketOperationUtils.getMarketSellOrdersAsync(createOrdersFromSellRates(FILL_AMOUNT, rates[types_1.ERC20BridgeSource.Native]), FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { numSamples: 4, runLimit: 512, noConflicts: false }))];
                        case 1:
                            improvedOrders = _a.sent();
                            orderSources = improvedOrders.map(function (o) { return o.fill.source; });
                            expectedSources = [
                                types_1.ERC20BridgeSource.Kyber,
                                types_1.ERC20BridgeSource.Eth2Dai,
                                types_1.ERC20BridgeSource.Uniswap,
                                types_1.ERC20BridgeSource.Native,
                            ];
                            contracts_test_utils_1.expect(orderSources).to.deep.eq(expectedSources);
                            return [2 /*return*/];
                    }
                });
            }); });
            it('excludes Kyber when `noConflicts` enabled and Uniswap or Eth2Dai are used first', function () { return __awaiter(_this, void 0, void 0, function () {
                var rates, improvedOrders, orderSources, expectedSources;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            rates = {};
                            rates[types_1.ERC20BridgeSource.Native] = [0.3, 0.2, 0.1, 0.05];
                            rates[types_1.ERC20BridgeSource.Uniswap] = [0.5, 0.05, 0.05, 0.05];
                            rates[types_1.ERC20BridgeSource.Eth2Dai] = [0.6, 0.05, 0.05, 0.05];
                            rates[types_1.ERC20BridgeSource.Kyber] = [0.4, 0.05, 0.05, 0.05];
                            replaceSamplerOps({
                                getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                            });
                            return [4 /*yield*/, marketOperationUtils.getMarketSellOrdersAsync(createOrdersFromSellRates(FILL_AMOUNT, rates[types_1.ERC20BridgeSource.Native]), FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { numSamples: 4, runLimit: 512, noConflicts: true }))];
                        case 1:
                            improvedOrders = _a.sent();
                            orderSources = improvedOrders.map(function (o) { return o.fill.source; });
                            expectedSources = [
                                types_1.ERC20BridgeSource.Eth2Dai,
                                types_1.ERC20BridgeSource.Uniswap,
                                types_1.ERC20BridgeSource.Native,
                                types_1.ERC20BridgeSource.Native,
                            ];
                            contracts_test_utils_1.expect(orderSources).to.deep.eq(expectedSources);
                            return [2 /*return*/];
                    }
                });
            }); });
            it('excludes Uniswap and Eth2Dai when `noConflicts` enabled and Kyber is used first', function () { return __awaiter(_this, void 0, void 0, function () {
                var rates, improvedOrders, orderSources, expectedSources;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            rates = {};
                            rates[types_1.ERC20BridgeSource.Native] = [0.1, 0.05, 0.05, 0.05];
                            rates[types_1.ERC20BridgeSource.Uniswap] = [0.15, 0.05, 0.05, 0.05];
                            rates[types_1.ERC20BridgeSource.Eth2Dai] = [0.15, 0.05, 0.05, 0.05];
                            rates[types_1.ERC20BridgeSource.Kyber] = [0.7, 0.05, 0.05, 0.05];
                            replaceSamplerOps({
                                getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                            });
                            return [4 /*yield*/, marketOperationUtils.getMarketSellOrdersAsync(createOrdersFromSellRates(FILL_AMOUNT, rates[types_1.ERC20BridgeSource.Native]), FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { numSamples: 4, runLimit: 512, noConflicts: true }))];
                        case 1:
                            improvedOrders = _a.sent();
                            orderSources = improvedOrders.map(function (o) { return o.fill.source; });
                            expectedSources = [
                                types_1.ERC20BridgeSource.Kyber,
                                types_1.ERC20BridgeSource.Native,
                                types_1.ERC20BridgeSource.Native,
                                types_1.ERC20BridgeSource.Native,
                            ];
                            contracts_test_utils_1.expect(orderSources).to.deep.eq(expectedSources);
                            return [2 /*return*/];
                    }
                });
            }); });
            var ETH_TO_MAKER_RATE = 1.5;
            it('factors in fees for native orders', function () { return __awaiter(_this, void 0, void 0, function () {
                var _a, _b, nativeFeeRate, rates, fees, improvedOrders, orderSources, expectedSources;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            nativeFeeRate = 0.06;
                            rates = (_a = {},
                                _a[types_1.ERC20BridgeSource.Native] = [1, 0.99, 0.98, 0.97],
                                _a[types_1.ERC20BridgeSource.Uniswap] = [0.96, 0.1, 0.1, 0.1],
                                _a[types_1.ERC20BridgeSource.Eth2Dai] = [0.95, 0.1, 0.1, 0.1],
                                _a[types_1.ERC20BridgeSource.Kyber] = [0.1, 0.1, 0.1, 0.1],
                                _a);
                            fees = (_b = {},
                                _b[types_1.ERC20BridgeSource.Native] = FILL_AMOUNT.div(4)
                                    .times(nativeFeeRate)
                                    .dividedToIntegerBy(ETH_TO_MAKER_RATE),
                                _b);
                            replaceSamplerOps({
                                getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                                getMedianSellRate: createGetMedianSellRate(ETH_TO_MAKER_RATE),
                            });
                            return [4 /*yield*/, marketOperationUtils.getMarketSellOrdersAsync(createOrdersFromSellRates(FILL_AMOUNT, rates[types_1.ERC20BridgeSource.Native]), FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { numSamples: 4, runLimit: 512, noConflicts: false, fees: fees }))];
                        case 1:
                            improvedOrders = _c.sent();
                            orderSources = improvedOrders.map(function (o) { return o.fill.source; });
                            expectedSources = [
                                types_1.ERC20BridgeSource.Uniswap,
                                types_1.ERC20BridgeSource.Eth2Dai,
                                types_1.ERC20BridgeSource.Native,
                                types_1.ERC20BridgeSource.Native,
                            ];
                            contracts_test_utils_1.expect(orderSources).to.deep.eq(expectedSources);
                            return [2 /*return*/];
                    }
                });
            }); });
            it('factors in fees for dexes', function () { return __awaiter(_this, void 0, void 0, function () {
                var _a, _b, kyberFeeRate, rates, fees, improvedOrders, orderSources, expectedSources;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            kyberFeeRate = 0.2;
                            rates = (_a = {},
                                _a[types_1.ERC20BridgeSource.Native] = [0.95, 0.1, 0.1, 0.1],
                                _a[types_1.ERC20BridgeSource.Uniswap] = [0.1, 0.1, 0.1, 0.1],
                                _a[types_1.ERC20BridgeSource.Eth2Dai] = [0.92, 0.1, 0.1, 0.1],
                                // Effectively [0.8, ~0.5, ~0, ~0]
                                _a[types_1.ERC20BridgeSource.Kyber] = [1, 0.7, 0.2, 0.2],
                                _a);
                            fees = (_b = {},
                                _b[types_1.ERC20BridgeSource.Kyber] = FILL_AMOUNT.div(4)
                                    .times(kyberFeeRate)
                                    .dividedToIntegerBy(ETH_TO_MAKER_RATE),
                                _b);
                            replaceSamplerOps({
                                getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                                getMedianSellRate: createGetMedianSellRate(ETH_TO_MAKER_RATE),
                            });
                            return [4 /*yield*/, marketOperationUtils.getMarketSellOrdersAsync(createOrdersFromSellRates(FILL_AMOUNT, rates[types_1.ERC20BridgeSource.Native]), FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { numSamples: 4, runLimit: 512, noConflicts: false, fees: fees }))];
                        case 1:
                            improvedOrders = _c.sent();
                            orderSources = improvedOrders.map(function (o) { return o.fill.source; });
                            expectedSources = [types_1.ERC20BridgeSource.Native, types_1.ERC20BridgeSource.Eth2Dai, types_1.ERC20BridgeSource.Kyber];
                            contracts_test_utils_1.expect(orderSources).to.deep.eq(expectedSources);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe('getMarketBuyOrdersAsync()', function () {
            var FILL_AMOUNT = contracts_test_utils_1.getRandomInteger(1, 1e18);
            var ORDERS = createOrdersFromBuyRates(FILL_AMOUNT, _.times(NUM_SAMPLES, function () { return DEFAULT_RATES[types_1.ERC20BridgeSource.Native][0]; }));
            var DEFAULT_OPTS = {
                numSamples: NUM_SAMPLES,
                runLimit: 0,
                sampleDistributionBase: 1,
                excludedSources: [
                    types_1.ERC20BridgeSource.CurveUsdcDai,
                    types_1.ERC20BridgeSource.CurveUsdcDaiUsdt,
                    types_1.ERC20BridgeSource.CurveUsdcDaiUsdtTusd,
                ],
            };
            beforeEach(function () {
                replaceSamplerOps();
            });
            it('queries `numSamples` samples', function () { return __awaiter(_this, void 0, void 0, function () {
                var numSamples, actualNumSamples;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            numSamples = _.random(1, 16);
                            actualNumSamples = 0;
                            replaceSamplerOps({
                                getBuyQuotes: function (sources, makerToken, takerToken, amounts) {
                                    actualNumSamples = amounts.length;
                                    return DEFAULT_OPS.getBuyQuotes(sources, makerToken, takerToken, amounts);
                                },
                            });
                            return [4 /*yield*/, marketOperationUtils.getMarketBuyOrdersAsync(ORDERS, FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { numSamples: numSamples }))];
                        case 1:
                            _a.sent();
                            contracts_test_utils_1.expect(actualNumSamples).eq(numSamples);
                            return [2 /*return*/];
                    }
                });
            }); });
            it('polls all DEXes if `excludedSources` is empty', function () { return __awaiter(_this, void 0, void 0, function () {
                var sourcesPolled;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            sourcesPolled = [];
                            replaceSamplerOps({
                                getBuyQuotes: function (sources, makerToken, takerToken, amounts) {
                                    sourcesPolled = sources.slice();
                                    return DEFAULT_OPS.getBuyQuotes(sources, makerToken, takerToken, amounts);
                                },
                            });
                            return [4 /*yield*/, marketOperationUtils.getMarketBuyOrdersAsync(ORDERS, FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { excludedSources: [] }))];
                        case 1:
                            _a.sent();
                            contracts_test_utils_1.expect(sourcesPolled).to.deep.eq(BUY_SOURCES);
                            return [2 /*return*/];
                    }
                });
            }); });
            it('does not poll DEXes in `excludedSources`', function () { return __awaiter(_this, void 0, void 0, function () {
                var excludedSources, sourcesPolled;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            excludedSources = _.sampleSize(SELL_SOURCES, _.random(1, SELL_SOURCES.length));
                            sourcesPolled = [];
                            replaceSamplerOps({
                                getBuyQuotes: function (sources, makerToken, takerToken, amounts) {
                                    sourcesPolled = sources.slice();
                                    return DEFAULT_OPS.getBuyQuotes(sources, makerToken, takerToken, amounts);
                                },
                            });
                            return [4 /*yield*/, marketOperationUtils.getMarketBuyOrdersAsync(ORDERS, FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { excludedSources: excludedSources }))];
                        case 1:
                            _a.sent();
                            contracts_test_utils_1.expect(sourcesPolled).to.deep.eq(_.without.apply(_, __spread([BUY_SOURCES], excludedSources)));
                            return [2 /*return*/];
                    }
                });
            }); });
            it('returns the most cost-effective single source if `runLimit == 0`', function () { return __awaiter(_this, void 0, void 0, function () {
                var bestSource, improvedOrders, uniqueAssetDatas;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            bestSource = findSourceWithMaxOutput(_.omit(DEFAULT_RATES, types_1.ERC20BridgeSource.Kyber, types_1.ERC20BridgeSource.CurveUsdcDai, types_1.ERC20BridgeSource.CurveUsdcDaiUsdt, types_1.ERC20BridgeSource.CurveUsdcDaiUsdtTusd));
                            contracts_test_utils_1.expect(bestSource).to.exist('');
                            return [4 /*yield*/, marketOperationUtils.getMarketBuyOrdersAsync(ORDERS, FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { runLimit: 0 }))];
                        case 1:
                            improvedOrders = _a.sent();
                            uniqueAssetDatas = _.uniq(improvedOrders.map(function (o) { return o.makerAssetData; }));
                            contracts_test_utils_1.expect(uniqueAssetDatas).to.be.length(1);
                            contracts_test_utils_1.expect(getSourceFromAssetData(uniqueAssetDatas[0])).to.be.eq(bestSource);
                            return [2 /*return*/];
                    }
                });
            }); });
            it('generates bridge orders with correct asset data', function () { return __awaiter(_this, void 0, void 0, function () {
                var e_3, _a, improvedOrders, improvedOrders_3, improvedOrders_3_1, order, makerAssetDataPrefix;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, marketOperationUtils.getMarketBuyOrdersAsync(
                            // Pass in empty orders to prevent native orders from being used.
                            ORDERS.map(function (o) { return (__assign({}, o, { makerAssetAmount: contracts_test_utils_1.constants.ZERO_AMOUNT })); }), FILL_AMOUNT, DEFAULT_OPTS)];
                        case 1:
                            improvedOrders = _b.sent();
                            contracts_test_utils_1.expect(improvedOrders).to.not.be.length(0);
                            try {
                                for (improvedOrders_3 = __values(improvedOrders), improvedOrders_3_1 = improvedOrders_3.next(); !improvedOrders_3_1.done; improvedOrders_3_1 = improvedOrders_3.next()) {
                                    order = improvedOrders_3_1.value;
                                    contracts_test_utils_1.expect(getSourceFromAssetData(order.makerAssetData)).to.exist('');
                                    makerAssetDataPrefix = utils_1.hexUtils.slice(order_utils_1.assetDataUtils.encodeERC20BridgeAssetData(MAKER_TOKEN, contracts_test_utils_1.constants.NULL_ADDRESS, contracts_test_utils_1.constants.NULL_BYTES), 0, 36);
                                    assertSamePrefix(order.makerAssetData, makerAssetDataPrefix);
                                    contracts_test_utils_1.expect(order.takerAssetData).to.eq(TAKER_ASSET_DATA);
                                }
                            }
                            catch (e_3_1) { e_3 = { error: e_3_1 }; }
                            finally {
                                try {
                                    if (improvedOrders_3_1 && !improvedOrders_3_1.done && (_a = improvedOrders_3.return)) _a.call(improvedOrders_3);
                                }
                                finally { if (e_3) throw e_3.error; }
                            }
                            return [2 /*return*/];
                    }
                });
            }); });
            it('generates bridge orders with correct taker amount', function () { return __awaiter(_this, void 0, void 0, function () {
                var improvedOrders, totalMakerAssetAmount;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, marketOperationUtils.getMarketBuyOrdersAsync(
                            // Pass in empty orders to prevent native orders from being used.
                            ORDERS.map(function (o) { return (__assign({}, o, { makerAssetAmount: contracts_test_utils_1.constants.ZERO_AMOUNT })); }), FILL_AMOUNT, DEFAULT_OPTS)];
                        case 1:
                            improvedOrders = _a.sent();
                            totalMakerAssetAmount = utils_1.BigNumber.sum.apply(utils_1.BigNumber, __spread(improvedOrders.map(function (o) { return o.makerAssetAmount; })));
                            contracts_test_utils_1.expect(totalMakerAssetAmount).to.bignumber.gte(FILL_AMOUNT);
                            return [2 /*return*/];
                    }
                });
            }); });
            it('generates bridge orders with max slippage of `bridgeSlippage`', function () { return __awaiter(_this, void 0, void 0, function () {
                var e_4, _a, bridgeSlippage, improvedOrders, improvedOrders_4, improvedOrders_4_1, order, source, expectedTakerAmount, slippage;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            bridgeSlippage = _.random(0.1, true);
                            return [4 /*yield*/, marketOperationUtils.getMarketBuyOrdersAsync(
                                // Pass in empty orders to prevent native orders from being used.
                                ORDERS.map(function (o) { return (__assign({}, o, { makerAssetAmount: contracts_test_utils_1.constants.ZERO_AMOUNT })); }), FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { bridgeSlippage: bridgeSlippage }))];
                        case 1:
                            improvedOrders = _b.sent();
                            contracts_test_utils_1.expect(improvedOrders).to.not.be.length(0);
                            try {
                                for (improvedOrders_4 = __values(improvedOrders), improvedOrders_4_1 = improvedOrders_4.next(); !improvedOrders_4_1.done; improvedOrders_4_1 = improvedOrders_4.next()) {
                                    order = improvedOrders_4_1.value;
                                    source = getSourceFromAssetData(order.makerAssetData);
                                    expectedTakerAmount = FILL_AMOUNT.div(_.last(DEFAULT_RATES[source]));
                                    slippage = order.takerAssetAmount.div(expectedTakerAmount.plus(1)).toNumber() - 1;
                                    contracts_test_utils_1.assertRoughlyEquals(slippage, bridgeSlippage, 8);
                                }
                            }
                            catch (e_4_1) { e_4 = { error: e_4_1 }; }
                            finally {
                                try {
                                    if (improvedOrders_4_1 && !improvedOrders_4_1.done && (_a = improvedOrders_4.return)) _a.call(improvedOrders_4);
                                }
                                finally { if (e_4) throw e_4.error; }
                            }
                            return [2 /*return*/];
                    }
                });
            }); });
            it('can mix convex sources', function () { return __awaiter(_this, void 0, void 0, function () {
                var rates, improvedOrders, orderSources, expectedSources;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            rates = {};
                            rates[types_1.ERC20BridgeSource.Native] = [0.4, 0.3, 0.2, 0.1];
                            rates[types_1.ERC20BridgeSource.Uniswap] = [0.5, 0.05, 0.05, 0.05];
                            rates[types_1.ERC20BridgeSource.Eth2Dai] = [0.6, 0.05, 0.05, 0.05];
                            replaceSamplerOps({
                                getBuyQuotes: createGetMultipleBuyQuotesOperationFromRates(rates),
                            });
                            return [4 /*yield*/, marketOperationUtils.getMarketBuyOrdersAsync(createOrdersFromBuyRates(FILL_AMOUNT, rates[types_1.ERC20BridgeSource.Native]), FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { numSamples: 4, runLimit: 512 }))];
                        case 1:
                            improvedOrders = _a.sent();
                            orderSources = improvedOrders.map(function (o) { return o.fill.source; });
                            expectedSources = [
                                types_1.ERC20BridgeSource.Eth2Dai,
                                types_1.ERC20BridgeSource.Uniswap,
                                types_1.ERC20BridgeSource.Native,
                                types_1.ERC20BridgeSource.Native,
                            ];
                            contracts_test_utils_1.expect(orderSources).to.deep.eq(expectedSources);
                            return [2 /*return*/];
                    }
                });
            }); });
            var ETH_TO_TAKER_RATE = 1.5;
            it('factors in fees for native orders', function () { return __awaiter(_this, void 0, void 0, function () {
                var _a, _b, nativeFeeRate, rates, fees, improvedOrders, orderSources, expectedSources;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            nativeFeeRate = 0.06;
                            rates = (_a = {},
                                _a[types_1.ERC20BridgeSource.Native] = [1, 0.99, 0.98, 0.97],
                                _a[types_1.ERC20BridgeSource.Uniswap] = [0.96, 0.1, 0.1, 0.1],
                                _a[types_1.ERC20BridgeSource.Eth2Dai] = [0.95, 0.1, 0.1, 0.1],
                                _a[types_1.ERC20BridgeSource.Kyber] = [0.1, 0.1, 0.1, 0.1],
                                _a);
                            fees = (_b = {},
                                _b[types_1.ERC20BridgeSource.Native] = FILL_AMOUNT.div(4)
                                    .times(nativeFeeRate)
                                    .dividedToIntegerBy(ETH_TO_TAKER_RATE),
                                _b);
                            replaceSamplerOps({
                                getBuyQuotes: createGetMultipleBuyQuotesOperationFromRates(rates),
                                getMedianSellRate: createGetMedianSellRate(ETH_TO_TAKER_RATE),
                            });
                            return [4 /*yield*/, marketOperationUtils.getMarketBuyOrdersAsync(createOrdersFromBuyRates(FILL_AMOUNT, rates[types_1.ERC20BridgeSource.Native]), FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { numSamples: 4, runLimit: 512, fees: fees }))];
                        case 1:
                            improvedOrders = _c.sent();
                            orderSources = improvedOrders.map(function (o) { return o.fill.source; });
                            expectedSources = [
                                types_1.ERC20BridgeSource.Uniswap,
                                types_1.ERC20BridgeSource.Eth2Dai,
                                types_1.ERC20BridgeSource.Native,
                                types_1.ERC20BridgeSource.Native,
                            ];
                            contracts_test_utils_1.expect(orderSources).to.deep.eq(expectedSources);
                            return [2 /*return*/];
                    }
                });
            }); });
            it('factors in fees for dexes', function () { return __awaiter(_this, void 0, void 0, function () {
                var _a, _b, uniswapFeeRate, rates, fees, improvedOrders, orderSources, expectedSources;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            uniswapFeeRate = 0.2;
                            rates = (_a = {},
                                _a[types_1.ERC20BridgeSource.Native] = [0.95, 0.1, 0.1, 0.1],
                                // Effectively [0.8, ~0.5, ~0, ~0]
                                _a[types_1.ERC20BridgeSource.Uniswap] = [1, 0.7, 0.2, 0.2],
                                _a[types_1.ERC20BridgeSource.Eth2Dai] = [0.92, 0.1, 0.1, 0.1],
                                _a);
                            fees = (_b = {},
                                _b[types_1.ERC20BridgeSource.Uniswap] = FILL_AMOUNT.div(4)
                                    .times(uniswapFeeRate)
                                    .dividedToIntegerBy(ETH_TO_TAKER_RATE),
                                _b);
                            replaceSamplerOps({
                                getBuyQuotes: createGetMultipleBuyQuotesOperationFromRates(rates),
                                getMedianSellRate: createGetMedianSellRate(ETH_TO_TAKER_RATE),
                            });
                            return [4 /*yield*/, marketOperationUtils.getMarketBuyOrdersAsync(createOrdersFromBuyRates(FILL_AMOUNT, rates[types_1.ERC20BridgeSource.Native]), FILL_AMOUNT, __assign({}, DEFAULT_OPTS, { numSamples: 4, runLimit: 512, fees: fees }))];
                        case 1:
                            improvedOrders = _c.sent();
                            orderSources = improvedOrders.map(function (o) { return o.fill.source; });
                            expectedSources = [
                                types_1.ERC20BridgeSource.Native,
                                types_1.ERC20BridgeSource.Eth2Dai,
                                types_1.ERC20BridgeSource.Uniswap,
                            ];
                            contracts_test_utils_1.expect(orderSources).to.deep.eq(expectedSources);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
});
// tslint:disable-next-line: max-file-line-count
//# sourceMappingURL=market_operation_utils_test.js.map