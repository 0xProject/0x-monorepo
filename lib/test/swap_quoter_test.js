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
var subproviders_1 = require("@0x/subproviders");
var utils_1 = require("@0x/utils");
var chai = require("chai");
require("mocha");
var TypeMoq = require("typemoq");
var src_1 = require("../src");
var constants_1 = require("../src/constants");
var chai_setup_1 = require("./utils/chai_setup");
var mocks_1 = require("./utils/mocks");
var test_order_factory_1 = require("./utils/test_order_factory");
var utils_2 = require("./utils/utils");
chai_setup_1.chaiSetup.configure();
var expect = chai.expect;
var FAKE_SRA_URL = 'https://fakeurl.com';
var FAKE_TAKER_ASSET_DATA = '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48';
var FAKE_MAKER_ASSET_DATA = '0xf47261b00000000000000000000000009f5B0C7e1623793bF0620569b9749e79DF6D0bC5';
var TOKEN_DECIMALS = 18;
var DAI_ASSET_DATA = '0xf47261b000000000000000000000000089d24a6b4ccb1b6faa2625fe562bdd9a23260359"';
var WETH_ASSET_DATA = '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
var WETH_DECIMALS = constants_1.constants.ETHER_TOKEN_DECIMALS;
var ZERO = new utils_1.BigNumber(0);
var assetsToAssetPairItems = function (makerAssetData, takerAssetData) {
    var defaultAssetPairItem = {
        minAmount: ZERO,
        maxAmount: ZERO,
        precision: TOKEN_DECIMALS,
    };
    return [
        {
            assetDataA: __assign({}, defaultAssetPairItem, { assetData: makerAssetData }),
            assetDataB: __assign({}, defaultAssetPairItem, { assetData: takerAssetData }),
        },
        {
            assetDataA: __assign({}, defaultAssetPairItem, { assetData: takerAssetData }),
            assetDataB: __assign({}, defaultAssetPairItem, { assetData: makerAssetData }),
        },
    ];
};
var expectLiquidityResult = function (web3Provider, orderbook, orders, expectedLiquidityResult) { return __awaiter(_this, void 0, void 0, function () {
    var mockedSwapQuoter, liquidityResult;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                mockedSwapQuoter = mocks_1.mockedSwapQuoterWithFillableAmounts(web3Provider, orderbook, FAKE_MAKER_ASSET_DATA, WETH_ASSET_DATA, orders);
                return [4 /*yield*/, mockedSwapQuoter.object.getLiquidityForMakerTakerAssetDataPairAsync(FAKE_MAKER_ASSET_DATA, WETH_ASSET_DATA)];
            case 1:
                liquidityResult = _a.sent();
                expect(liquidityResult).to.deep.equal(expectedLiquidityResult);
                return [2 /*return*/];
        }
    });
}); };
// tslint:disable:custom-no-magic-numbers
describe('SwapQuoter', function () {
    describe('getLiquidityForMakerTakerAssetDataPairAsync', function () {
        var mockWeb3Provider = TypeMoq.Mock.ofType(subproviders_1.Web3ProviderEngine);
        var mockOrderbook = mocks_1.orderbookMock();
        beforeEach(function () {
            mockWeb3Provider.reset();
            mockOrderbook.reset();
        });
        afterEach(function () {
            mockWeb3Provider.verifyAll();
            mockOrderbook.verifyAll();
        });
        describe('validation', function () {
            it('should ensure takerAssetData is a string', function () { return __awaiter(_this, void 0, void 0, function () {
                var swapQuoter;
                return __generator(this, function (_a) {
                    swapQuoter = src_1.SwapQuoter.getSwapQuoterForStandardRelayerAPIUrl(mockWeb3Provider.object, FAKE_SRA_URL);
                    expect(swapQuoter.getLiquidityForMakerTakerAssetDataPairAsync(FAKE_MAKER_ASSET_DATA, false)).to.be.rejectedWith('Expected takerAssetData to be of type string, encountered: false');
                    return [2 /*return*/];
                });
            }); });
            it('should ensure makerAssetData is a string', function () { return __awaiter(_this, void 0, void 0, function () {
                var swapQuoter;
                return __generator(this, function (_a) {
                    swapQuoter = src_1.SwapQuoter.getSwapQuoterForStandardRelayerAPIUrl(mockWeb3Provider.object, FAKE_SRA_URL);
                    expect(swapQuoter.getLiquidityForMakerTakerAssetDataPairAsync(false, FAKE_TAKER_ASSET_DATA)).to.be.rejectedWith('Expected makerAssetData to be of type string, encountered: false');
                    return [2 /*return*/];
                });
            }); });
        });
        describe('asset pair not supported', function () {
            it('should return 0s when no asset pair are supported', function () { return __awaiter(_this, void 0, void 0, function () {
                var swapQuoter, liquidityResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            mocks_1.mockAvailableAssetDatas(mockOrderbook, []);
                            swapQuoter = new src_1.SwapQuoter(mockWeb3Provider.object, mockOrderbook.object);
                            return [4 /*yield*/, swapQuoter.getLiquidityForMakerTakerAssetDataPairAsync(FAKE_MAKER_ASSET_DATA, FAKE_TAKER_ASSET_DATA)];
                        case 1:
                            liquidityResult = _a.sent();
                            expect(liquidityResult).to.deep.equal({
                                makerAssetAvailableInBaseUnits: new utils_1.BigNumber(0),
                                takerAssetAvailableInBaseUnits: new utils_1.BigNumber(0),
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should return 0s when only other asset pair supported', function () { return __awaiter(_this, void 0, void 0, function () {
                var swapQuoter, liquidityResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            mocks_1.mockAvailableAssetDatas(mockOrderbook, assetsToAssetPairItems(FAKE_MAKER_ASSET_DATA, DAI_ASSET_DATA));
                            swapQuoter = new src_1.SwapQuoter(mockWeb3Provider.object, mockOrderbook.object);
                            return [4 /*yield*/, swapQuoter.getLiquidityForMakerTakerAssetDataPairAsync(FAKE_MAKER_ASSET_DATA, FAKE_TAKER_ASSET_DATA)];
                        case 1:
                            liquidityResult = _a.sent();
                            expect(liquidityResult).to.deep.equal({
                                makerAssetAvailableInBaseUnits: new utils_1.BigNumber(0),
                                takerAssetAvailableInBaseUnits: new utils_1.BigNumber(0),
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe('assetData is supported', function () {
            // orders
            var sellTenTokensFor10Weth = test_order_factory_1.testOrderFactory.generateTestSignedOrder({
                makerAssetAmount: utils_2.baseUnitAmount(10),
                takerAssetAmount: utils_2.baseUnitAmount(10, WETH_DECIMALS),
                chainId: 42,
            });
            beforeEach(function () {
                mocks_1.mockAvailableAssetDatas(mockOrderbook, assetsToAssetPairItems(WETH_ASSET_DATA, FAKE_MAKER_ASSET_DATA));
            });
            it('should return 0s when no orders available', function () { return __awaiter(_this, void 0, void 0, function () {
                var orders, expectedResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            orders = [];
                            expectedResult = {
                                makerAssetAvailableInBaseUnits: new utils_1.BigNumber(0),
                                takerAssetAvailableInBaseUnits: new utils_1.BigNumber(0),
                            };
                            return [4 /*yield*/, expectLiquidityResult(mockWeb3Provider.object, mockOrderbook.object, orders, expectedResult)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should return correct computed value when orders provided with full fillableAmounts', function () { return __awaiter(_this, void 0, void 0, function () {
                var orders, expectedMakerAssetAvailable, expectedTakerAssetAvailable, expectedResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            orders = [
                                __assign({}, sellTenTokensFor10Weth, {
                                    fillableMakerAssetAmount: sellTenTokensFor10Weth.makerAssetAmount,
                                    fillableTakerAssetAmount: sellTenTokensFor10Weth.takerAssetAmount,
                                    fillableTakerFeeAmount: constants_1.constants.ZERO_AMOUNT,
                                }),
                                __assign({}, sellTenTokensFor10Weth, {
                                    fillableMakerAssetAmount: sellTenTokensFor10Weth.makerAssetAmount,
                                    fillableTakerAssetAmount: sellTenTokensFor10Weth.takerAssetAmount,
                                    fillableTakerFeeAmount: constants_1.constants.ZERO_AMOUNT,
                                }),
                            ];
                            expectedMakerAssetAvailable = orders[0].makerAssetAmount.plus(orders[1].makerAssetAmount);
                            expectedTakerAssetAvailable = orders[0].takerAssetAmount.plus(orders[1].takerAssetAmount);
                            expectedResult = {
                                makerAssetAvailableInBaseUnits: expectedMakerAssetAvailable,
                                takerAssetAvailableInBaseUnits: expectedTakerAssetAvailable,
                            };
                            return [4 /*yield*/, expectLiquidityResult(mockWeb3Provider.object, mockOrderbook.object, orders, expectedResult)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should return correct computed value with one partial fillableAmounts', function () { return __awaiter(_this, void 0, void 0, function () {
                var orders, expectedResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            orders = [
                                __assign({}, sellTenTokensFor10Weth, {
                                    fillableMakerAssetAmount: utils_2.baseUnitAmount(1),
                                    fillableTakerAssetAmount: utils_2.baseUnitAmount(0.5, WETH_DECIMALS),
                                    fillableTakerFeeAmount: constants_1.constants.ZERO_AMOUNT,
                                }),
                            ];
                            expectedResult = {
                                makerAssetAvailableInBaseUnits: utils_2.baseUnitAmount(1),
                                takerAssetAvailableInBaseUnits: utils_2.baseUnitAmount(0.5, WETH_DECIMALS),
                            };
                            return [4 /*yield*/, expectLiquidityResult(mockWeb3Provider.object, mockOrderbook.object, orders, expectedResult)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should return correct computed value with multiple orders and fillable amounts', function () { return __awaiter(_this, void 0, void 0, function () {
                var orders, expectedResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            orders = [
                                __assign({}, sellTenTokensFor10Weth, {
                                    fillableMakerAssetAmount: utils_2.baseUnitAmount(1),
                                    fillableTakerAssetAmount: utils_2.baseUnitAmount(0.5, WETH_DECIMALS),
                                    fillableTakerFeeAmount: constants_1.constants.ZERO_AMOUNT,
                                }),
                                __assign({}, sellTenTokensFor10Weth, {
                                    fillableMakerAssetAmount: utils_2.baseUnitAmount(3),
                                    fillableTakerAssetAmount: utils_2.baseUnitAmount(3, WETH_DECIMALS),
                                    fillableTakerFeeAmount: constants_1.constants.ZERO_AMOUNT,
                                }),
                            ];
                            expectedResult = {
                                makerAssetAvailableInBaseUnits: utils_2.baseUnitAmount(4),
                                takerAssetAvailableInBaseUnits: utils_2.baseUnitAmount(3.5, WETH_DECIMALS),
                            };
                            return [4 /*yield*/, expectLiquidityResult(mockWeb3Provider.object, mockOrderbook.object, orders, expectedResult)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should return 0s when no amounts fillable', function () { return __awaiter(_this, void 0, void 0, function () {
                var orders, expectedResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            orders = [
                                __assign({}, sellTenTokensFor10Weth, {
                                    fillableMakerAssetAmount: constants_1.constants.ZERO_AMOUNT,
                                    fillableTakerAssetAmount: constants_1.constants.ZERO_AMOUNT,
                                    fillableTakerFeeAmount: constants_1.constants.ZERO_AMOUNT,
                                }),
                                __assign({}, sellTenTokensFor10Weth, {
                                    fillableMakerAssetAmount: constants_1.constants.ZERO_AMOUNT,
                                    fillableTakerAssetAmount: constants_1.constants.ZERO_AMOUNT,
                                    fillableTakerFeeAmount: constants_1.constants.ZERO_AMOUNT,
                                }),
                            ];
                            expectedResult = {
                                makerAssetAvailableInBaseUnits: constants_1.constants.ZERO_AMOUNT,
                                takerAssetAvailableInBaseUnits: constants_1.constants.ZERO_AMOUNT,
                            };
                            return [4 /*yield*/, expectLiquidityResult(mockWeb3Provider.object, mockOrderbook.object, orders, expectedResult)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
});
//# sourceMappingURL=swap_quoter_test.js.map