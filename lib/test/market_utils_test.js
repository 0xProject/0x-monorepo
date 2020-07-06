"use strict";
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
var utils_1 = require("@0x/utils");
var chai = require("chai");
require("mocha");
var src_1 = require("../src");
var constants_1 = require("../src/constants");
var chai_setup_1 = require("./utils/chai_setup");
var test_order_factory_1 = require("./utils/test_order_factory");
chai_setup_1.chaiSetup.configure();
var expect = chai.expect;
// tslint:disable: no-unused-expression
describe('marketUtils', function () {
    describe('#findOrdersThatCoverTakerAssetFillAmount', function () {
        describe('no orders', function () {
            it('returns empty and unchanged remainingFillAmount', function () { return __awaiter(_this, void 0, void 0, function () {
                var fillAmount, _a, resultOrders, remainingFillAmount;
                return __generator(this, function (_b) {
                    fillAmount = new utils_1.BigNumber(10);
                    _a = src_1.marketUtils.findOrdersThatCoverTakerAssetFillAmount([], fillAmount), resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount;
                    expect(resultOrders).to.be.empty;
                    expect(remainingFillAmount).to.be.bignumber.equal(fillAmount);
                    return [2 /*return*/];
                });
            }); });
        });
        describe('orders are completely fillable', function () {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            var takerAssetAmount = new utils_1.BigNumber(10);
            var inputOrders = test_order_factory_1.testOrderFactory.generateTestSignedOrders({
                takerAssetAmount: takerAssetAmount,
            }, 3);
            it('returns input orders and zero remainingFillAmount when input exactly matches requested fill amount', function () { return __awaiter(_this, void 0, void 0, function () {
                var fillAmount, slippageBufferAmount, _a, resultOrders, remainingFillAmount;
                return __generator(this, function (_b) {
                    fillAmount = new utils_1.BigNumber(20);
                    slippageBufferAmount = new utils_1.BigNumber(10);
                    _a = src_1.marketUtils.findOrdersThatCoverTakerAssetFillAmount(inputOrders, fillAmount, {
                        slippageBufferAmount: slippageBufferAmount,
                    }), resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount;
                    expect(resultOrders).to.be.deep.equal(inputOrders);
                    expect(remainingFillAmount).to.be.bignumber.equal(constants_1.constants.ZERO_AMOUNT);
                    return [2 /*return*/];
                });
            }); });
            it('returns input orders and zero remainingFillAmount when input has more than requested fill amount', function () { return __awaiter(_this, void 0, void 0, function () {
                var fillAmount, slippageBufferAmount, _a, resultOrders, remainingFillAmount;
                return __generator(this, function (_b) {
                    fillAmount = new utils_1.BigNumber(15);
                    slippageBufferAmount = new utils_1.BigNumber(10);
                    _a = src_1.marketUtils.findOrdersThatCoverTakerAssetFillAmount(inputOrders, fillAmount, {
                        slippageBufferAmount: slippageBufferAmount,
                    }), resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount;
                    expect(resultOrders).to.be.deep.equal(inputOrders);
                    expect(remainingFillAmount).to.be.bignumber.equal(constants_1.constants.ZERO_AMOUNT);
                    return [2 /*return*/];
                });
            }); });
            it('returns input orders and non-zero remainingFillAmount when input has less than requested fill amount', function () { return __awaiter(_this, void 0, void 0, function () {
                var fillAmount, slippageBufferAmount, _a, resultOrders, remainingFillAmount;
                return __generator(this, function (_b) {
                    fillAmount = new utils_1.BigNumber(30);
                    slippageBufferAmount = new utils_1.BigNumber(5);
                    _a = src_1.marketUtils.findOrdersThatCoverTakerAssetFillAmount(inputOrders, fillAmount, {
                        slippageBufferAmount: slippageBufferAmount,
                    }), resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount;
                    expect(resultOrders).to.be.deep.equal(inputOrders);
                    expect(remainingFillAmount).to.be.bignumber.equal(new utils_1.BigNumber(5));
                    return [2 /*return*/];
                });
            }); });
            it('returns first order and zero remainingFillAmount when requested fill amount is exactly covered by the first order', function () { return __awaiter(_this, void 0, void 0, function () {
                var fillAmount, _a, resultOrders, remainingFillAmount;
                return __generator(this, function (_b) {
                    fillAmount = new utils_1.BigNumber(10);
                    _a = src_1.marketUtils.findOrdersThatCoverTakerAssetFillAmount(inputOrders, fillAmount), resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount;
                    expect(resultOrders).to.be.deep.equal([inputOrders[0]]);
                    expect(remainingFillAmount).to.be.bignumber.equal(constants_1.constants.ZERO_AMOUNT);
                    return [2 /*return*/];
                });
            }); });
            it('returns first two orders and zero remainingFillAmount when requested fill amount is over covered by the first two order', function () { return __awaiter(_this, void 0, void 0, function () {
                var fillAmount, _a, resultOrders, remainingFillAmount;
                return __generator(this, function (_b) {
                    fillAmount = new utils_1.BigNumber(15);
                    _a = src_1.marketUtils.findOrdersThatCoverTakerAssetFillAmount(inputOrders, fillAmount), resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount;
                    expect(resultOrders).to.be.deep.equal([inputOrders[0], inputOrders[1]]);
                    expect(remainingFillAmount).to.be.bignumber.equal(constants_1.constants.ZERO_AMOUNT);
                    return [2 /*return*/];
                });
            }); });
        });
        describe('orders are partially fillable', function () {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            var takerAssetAmount = new utils_1.BigNumber(10);
            var inputOrders = test_order_factory_1.testOrderFactory.generateTestSignedOrders({
                takerAssetAmount: takerAssetAmount,
            }, 3);
            // generate remainingFillableMakerAssetAmounts that cover different partial fill scenarios
            // 1. order is completely filled already
            // 2. order is partially fillable
            // 3. order is completely fillable
            var remainingFillableTakerAssetAmounts = [constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(5), takerAssetAmount];
            it('returns last two orders and non-zero remainingFillAmount when trying to fill original takerAssetAmounts', function () { return __awaiter(_this, void 0, void 0, function () {
                var fillAmount, _a, resultOrders, remainingFillAmount;
                return __generator(this, function (_b) {
                    fillAmount = new utils_1.BigNumber(30);
                    _a = src_1.marketUtils.findOrdersThatCoverTakerAssetFillAmount(inputOrders, fillAmount, {
                        remainingFillableTakerAssetAmounts: remainingFillableTakerAssetAmounts,
                    }), resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount;
                    expect(resultOrders).to.be.deep.equal([inputOrders[1], inputOrders[2]]);
                    expect(remainingFillAmount).to.be.bignumber.equal(new utils_1.BigNumber(15));
                    return [2 /*return*/];
                });
            }); });
            it('returns last two orders and zero remainingFillAmount when trying to fill exactly takerAssetAmounts remaining', function () { return __awaiter(_this, void 0, void 0, function () {
                var fillAmount, _a, resultOrders, remainingFillAmount;
                return __generator(this, function (_b) {
                    fillAmount = new utils_1.BigNumber(15);
                    _a = src_1.marketUtils.findOrdersThatCoverTakerAssetFillAmount(inputOrders, fillAmount, {
                        remainingFillableTakerAssetAmounts: remainingFillableTakerAssetAmounts,
                    }), resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount;
                    expect(resultOrders).to.be.deep.equal([inputOrders[1], inputOrders[2]]);
                    expect(remainingFillAmount).to.be.bignumber.equal(new utils_1.BigNumber(0));
                    return [2 /*return*/];
                });
            }); });
        });
    });
    describe('#findOrdersThatCoverMakerAssetFillAmount', function () {
        describe('no orders', function () {
            it('returns empty and unchanged remainingFillAmount', function () { return __awaiter(_this, void 0, void 0, function () {
                var fillAmount, _a, resultOrders, remainingFillAmount;
                return __generator(this, function (_b) {
                    fillAmount = new utils_1.BigNumber(10);
                    _a = src_1.marketUtils.findOrdersThatCoverMakerAssetFillAmount([], fillAmount), resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount;
                    expect(resultOrders).to.be.empty;
                    expect(remainingFillAmount).to.be.bignumber.equal(fillAmount);
                    return [2 /*return*/];
                });
            }); });
        });
        describe('orders are completely fillable', function () {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            var makerAssetAmount = new utils_1.BigNumber(10);
            var inputOrders = test_order_factory_1.testOrderFactory.generateTestSignedOrders({
                makerAssetAmount: makerAssetAmount,
            }, 3);
            it('returns input orders and zero remainingFillAmount when input exactly matches requested fill amount', function () { return __awaiter(_this, void 0, void 0, function () {
                var fillAmount, slippageBufferAmount, _a, resultOrders, remainingFillAmount;
                return __generator(this, function (_b) {
                    fillAmount = new utils_1.BigNumber(20);
                    slippageBufferAmount = new utils_1.BigNumber(10);
                    _a = src_1.marketUtils.findOrdersThatCoverMakerAssetFillAmount(inputOrders, fillAmount, {
                        slippageBufferAmount: slippageBufferAmount,
                    }), resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount;
                    expect(resultOrders).to.be.deep.equal(inputOrders);
                    expect(remainingFillAmount).to.be.bignumber.equal(constants_1.constants.ZERO_AMOUNT);
                    return [2 /*return*/];
                });
            }); });
            it('returns input orders and zero remainingFillAmount when input has more than requested fill amount', function () { return __awaiter(_this, void 0, void 0, function () {
                var fillAmount, slippageBufferAmount, _a, resultOrders, remainingFillAmount;
                return __generator(this, function (_b) {
                    fillAmount = new utils_1.BigNumber(15);
                    slippageBufferAmount = new utils_1.BigNumber(10);
                    _a = src_1.marketUtils.findOrdersThatCoverMakerAssetFillAmount(inputOrders, fillAmount, {
                        slippageBufferAmount: slippageBufferAmount,
                    }), resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount;
                    expect(resultOrders).to.be.deep.equal(inputOrders);
                    expect(remainingFillAmount).to.be.bignumber.equal(constants_1.constants.ZERO_AMOUNT);
                    return [2 /*return*/];
                });
            }); });
            it('returns input orders and non-zero remainingFillAmount when input has less than requested fill amount', function () { return __awaiter(_this, void 0, void 0, function () {
                var fillAmount, slippageBufferAmount, _a, resultOrders, remainingFillAmount;
                return __generator(this, function (_b) {
                    fillAmount = new utils_1.BigNumber(30);
                    slippageBufferAmount = new utils_1.BigNumber(5);
                    _a = src_1.marketUtils.findOrdersThatCoverMakerAssetFillAmount(inputOrders, fillAmount, {
                        slippageBufferAmount: slippageBufferAmount,
                    }), resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount;
                    expect(resultOrders).to.be.deep.equal(inputOrders);
                    expect(remainingFillAmount).to.be.bignumber.equal(new utils_1.BigNumber(5));
                    return [2 /*return*/];
                });
            }); });
            it('returns first order and zero remainingFillAmount when requested fill amount is exactly covered by the first order', function () { return __awaiter(_this, void 0, void 0, function () {
                var fillAmount, _a, resultOrders, remainingFillAmount;
                return __generator(this, function (_b) {
                    fillAmount = new utils_1.BigNumber(10);
                    _a = src_1.marketUtils.findOrdersThatCoverMakerAssetFillAmount(inputOrders, fillAmount), resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount;
                    expect(resultOrders).to.be.deep.equal([inputOrders[0]]);
                    expect(remainingFillAmount).to.be.bignumber.equal(constants_1.constants.ZERO_AMOUNT);
                    return [2 /*return*/];
                });
            }); });
            it('returns first two orders and zero remainingFillAmount when requested fill amount is over covered by the first two order', function () { return __awaiter(_this, void 0, void 0, function () {
                var fillAmount, _a, resultOrders, remainingFillAmount;
                return __generator(this, function (_b) {
                    fillAmount = new utils_1.BigNumber(15);
                    _a = src_1.marketUtils.findOrdersThatCoverMakerAssetFillAmount(inputOrders, fillAmount), resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount;
                    expect(resultOrders).to.be.deep.equal([inputOrders[0], inputOrders[1]]);
                    expect(remainingFillAmount).to.be.bignumber.equal(constants_1.constants.ZERO_AMOUNT);
                    return [2 /*return*/];
                });
            }); });
        });
        describe('orders are partially fillable', function () {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            var makerAssetAmount = new utils_1.BigNumber(10);
            var inputOrders = test_order_factory_1.testOrderFactory.generateTestSignedOrders({
                makerAssetAmount: makerAssetAmount,
            }, 3);
            // generate remainingFillableMakerAssetAmounts that cover different partial fill scenarios
            // 1. order is completely filled already
            // 2. order is partially fillable
            // 3. order is completely fillable
            var remainingFillableMakerAssetAmounts = [constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(5), makerAssetAmount];
            it('returns last two orders and non-zero remainingFillAmount when trying to fill original makerAssetAmounts', function () { return __awaiter(_this, void 0, void 0, function () {
                var fillAmount, _a, resultOrders, remainingFillAmount;
                return __generator(this, function (_b) {
                    fillAmount = new utils_1.BigNumber(30);
                    _a = src_1.marketUtils.findOrdersThatCoverMakerAssetFillAmount(inputOrders, fillAmount, {
                        remainingFillableMakerAssetAmounts: remainingFillableMakerAssetAmounts,
                    }), resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount;
                    expect(resultOrders).to.be.deep.equal([inputOrders[1], inputOrders[2]]);
                    expect(remainingFillAmount).to.be.bignumber.equal(new utils_1.BigNumber(15));
                    return [2 /*return*/];
                });
            }); });
        });
    });
    describe('#findFeeOrdersThatCoverFeesForTargetOrders', function () {
        // generate three signed fee orders each with 10 units of ZRX, 30 total
        var zrxAmount = new utils_1.BigNumber(10);
        var inputFeeOrders = test_order_factory_1.testOrderFactory.generateTestSignedOrders({
            makerAssetAmount: zrxAmount,
        }, 3);
        describe('no target orders', function () {
            it('returns empty and zero remainingFeeAmount', function () { return __awaiter(_this, void 0, void 0, function () {
                var _a, resultFeeOrders, remainingFeeAmount;
                return __generator(this, function (_b) {
                    _a = src_1.marketUtils.findFeeOrdersThatCoverFeesForTargetOrders([], inputFeeOrders), resultFeeOrders = _a.resultFeeOrders, remainingFeeAmount = _a.remainingFeeAmount;
                    expect(resultFeeOrders).to.be.empty;
                    expect(remainingFeeAmount).to.be.bignumber.equal(constants_1.constants.ZERO_AMOUNT);
                    return [2 /*return*/];
                });
            }); });
        });
        describe('no fee orders', function () {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            // each signed order requires 10 units of takerFee
            var makerAssetAmount = new utils_1.BigNumber(10);
            var takerFee = new utils_1.BigNumber(10);
            var inputOrders = test_order_factory_1.testOrderFactory.generateTestSignedOrders({
                makerAssetAmount: makerAssetAmount,
                takerFee: takerFee,
            }, 3);
            // generate remainingFillableMakerAssetAmounts that equal the makerAssetAmount
            var remainingFillableMakerAssetAmounts = [makerAssetAmount, makerAssetAmount, makerAssetAmount];
            it('returns empty and non-zero remainingFeeAmount', function () { return __awaiter(_this, void 0, void 0, function () {
                var _a, resultFeeOrders, remainingFeeAmount;
                return __generator(this, function (_b) {
                    _a = src_1.marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(inputOrders, [], {
                        remainingFillableMakerAssetAmounts: remainingFillableMakerAssetAmounts,
                    }), resultFeeOrders = _a.resultFeeOrders, remainingFeeAmount = _a.remainingFeeAmount;
                    expect(resultFeeOrders).to.be.empty;
                    expect(remainingFeeAmount).to.be.bignumber.equal(new utils_1.BigNumber(30));
                    return [2 /*return*/];
                });
            }); });
        });
        describe('target orders have no fees', function () {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            var makerAssetAmount = new utils_1.BigNumber(10);
            var inputOrders = test_order_factory_1.testOrderFactory.generateTestSignedOrders({
                makerAssetAmount: makerAssetAmount,
            }, 3);
            it('returns empty and zero remainingFeeAmount', function () { return __awaiter(_this, void 0, void 0, function () {
                var _a, resultFeeOrders, remainingFeeAmount;
                return __generator(this, function (_b) {
                    _a = src_1.marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(inputOrders, inputFeeOrders), resultFeeOrders = _a.resultFeeOrders, remainingFeeAmount = _a.remainingFeeAmount;
                    expect(resultFeeOrders).to.be.empty;
                    expect(remainingFeeAmount).to.be.bignumber.equal(constants_1.constants.ZERO_AMOUNT);
                    return [2 /*return*/];
                });
            }); });
        });
        describe('target orders require fees and are completely fillable', function () {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            // each signed order requires 10 units of takerFee
            var makerAssetAmount = new utils_1.BigNumber(10);
            var takerFee = new utils_1.BigNumber(10);
            var inputOrders = test_order_factory_1.testOrderFactory.generateTestSignedOrders({
                makerAssetAmount: makerAssetAmount,
                takerFee: takerFee,
            }, 3);
            it('returns input fee orders and zero remainingFeeAmount', function () { return __awaiter(_this, void 0, void 0, function () {
                var _a, resultFeeOrders, remainingFeeAmount;
                return __generator(this, function (_b) {
                    _a = src_1.marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(inputOrders, inputFeeOrders), resultFeeOrders = _a.resultFeeOrders, remainingFeeAmount = _a.remainingFeeAmount;
                    expect(resultFeeOrders).to.be.deep.equal(inputFeeOrders);
                    expect(remainingFeeAmount).to.be.bignumber.equal(constants_1.constants.ZERO_AMOUNT);
                    return [2 /*return*/];
                });
            }); });
        });
        describe('target orders require fees and are partially fillable', function () {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            // each signed order requires 10 units of takerFee
            var makerAssetAmount = new utils_1.BigNumber(10);
            var takerFee = new utils_1.BigNumber(10);
            var inputOrders = test_order_factory_1.testOrderFactory.generateTestSignedOrders({
                makerAssetAmount: makerAssetAmount,
                takerFee: takerFee,
            }, 3);
            // generate remainingFillableMakerAssetAmounts that cover different partial fill scenarios
            // 1. order is completely filled already
            // 2. order is partially fillable
            // 3. order is completely fillable
            var remainingFillableMakerAssetAmounts = [constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(5), makerAssetAmount];
            it('returns first two input fee orders and zero remainingFeeAmount', function () { return __awaiter(_this, void 0, void 0, function () {
                var _a, resultFeeOrders, remainingFeeAmount;
                return __generator(this, function (_b) {
                    _a = src_1.marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(inputOrders, inputFeeOrders, {
                        remainingFillableMakerAssetAmounts: remainingFillableMakerAssetAmounts,
                    }), resultFeeOrders = _a.resultFeeOrders, remainingFeeAmount = _a.remainingFeeAmount;
                    expect(resultFeeOrders).to.be.deep.equal([inputFeeOrders[0], inputFeeOrders[1]]);
                    expect(remainingFeeAmount).to.be.bignumber.equal(constants_1.constants.ZERO_AMOUNT);
                    return [2 /*return*/];
                });
            }); });
        });
        describe('target orders require more fees than available', function () {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            // each signed order requires 20 units of takerFee
            var makerAssetAmount = new utils_1.BigNumber(10);
            var takerFee = new utils_1.BigNumber(20);
            var inputOrders = test_order_factory_1.testOrderFactory.generateTestSignedOrders({
                makerAssetAmount: makerAssetAmount,
                takerFee: takerFee,
            }, 3);
            it('returns input fee orders and non-zero remainingFeeAmount', function () { return __awaiter(_this, void 0, void 0, function () {
                var _a, resultFeeOrders, remainingFeeAmount;
                return __generator(this, function (_b) {
                    _a = src_1.marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(inputOrders, inputFeeOrders), resultFeeOrders = _a.resultFeeOrders, remainingFeeAmount = _a.remainingFeeAmount;
                    expect(resultFeeOrders).to.be.deep.equal(inputFeeOrders);
                    expect(remainingFeeAmount).to.be.bignumber.equal(new utils_1.BigNumber(30));
                    return [2 /*return*/];
                });
            }); });
        });
    });
});
//# sourceMappingURL=market_utils_test.js.map