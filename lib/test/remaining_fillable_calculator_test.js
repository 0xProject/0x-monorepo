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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@0x/utils");
var web3_wrapper_1 = require("@0x/web3-wrapper");
var chai = require("chai");
require("mocha");
var remaining_fillable_calculator_1 = require("../src/remaining_fillable_calculator");
var chai_setup_1 = require("./utils/chai_setup");
chai_setup_1.chaiSetup.configure();
var expect = chai.expect;
describe('RemainingFillableCalculator', function () {
    var calculator;
    var signedOrder;
    var transferrableMakeAssetAmount;
    var transferrableMakerFeeTokenAmount;
    var remainingMakeAssetAmount;
    var makerAmount;
    var takerAmount;
    var makerFeeAmount;
    var isPercentageFee;
    var makerAssetData = '0x1';
    var takerAssetData = '0x2';
    var makerFeeAssetData = '0x03';
    var takerFeeAssetData = '0x04';
    var decimals = 4;
    var zero = new utils_1.BigNumber(0);
    var chainId = 1337;
    var zeroAddress = '0x0';
    var signature = '0x1B61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace225403';
    beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            _a = __read([
                web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(50), decimals),
                web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(5), decimals),
                web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(1), decimals),
            ], 3), makerAmount = _a[0], takerAmount = _a[1], makerFeeAmount = _a[2];
            _b = __read([
                web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(50), decimals),
                web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(5), decimals),
            ], 2), transferrableMakeAssetAmount = _b[0], transferrableMakerFeeTokenAmount = _b[1];
            return [2 /*return*/];
        });
    }); });
    function buildSignedOrder() {
        return {
            signature: signature,
            feeRecipientAddress: zeroAddress,
            senderAddress: zeroAddress,
            makerAddress: zeroAddress,
            takerAddress: zeroAddress,
            makerFee: makerFeeAmount,
            takerFee: zero,
            makerAssetAmount: makerAmount,
            takerAssetAmount: takerAmount,
            makerAssetData: makerAssetData,
            takerAssetData: takerAssetData,
            makerFeeAssetData: makerFeeAssetData,
            takerFeeAssetData: takerFeeAssetData,
            salt: zero,
            expirationTimeSeconds: zero,
            exchangeAddress: zeroAddress,
            chainId: chainId,
        };
    }
    describe('Maker asset is not fee asset', function () {
        before(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                isPercentageFee = false;
                return [2 /*return*/];
            });
        }); });
        it('calculates the correct amount when unfilled and funds available', function () {
            signedOrder = buildSignedOrder();
            remainingMakeAssetAmount = signedOrder.makerAssetAmount;
            calculator = new remaining_fillable_calculator_1.RemainingFillableCalculator(signedOrder.makerFee, signedOrder.makerAssetAmount, isPercentageFee, transferrableMakeAssetAmount, transferrableMakerFeeTokenAmount, remainingMakeAssetAmount);
            expect(calculator.computeRemainingFillable()).to.be.bignumber.equal(remainingMakeAssetAmount);
        });
        it('calculates the correct amount when partially filled and funds available', function () {
            signedOrder = buildSignedOrder();
            remainingMakeAssetAmount = web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(1), decimals);
            calculator = new remaining_fillable_calculator_1.RemainingFillableCalculator(signedOrder.makerFee, signedOrder.makerAssetAmount, isPercentageFee, transferrableMakeAssetAmount, transferrableMakerFeeTokenAmount, remainingMakeAssetAmount);
            expect(calculator.computeRemainingFillable()).to.be.bignumber.equal(remainingMakeAssetAmount);
        });
        it('calculates the amount to be 0 when all fee funds are transferred', function () {
            signedOrder = buildSignedOrder();
            transferrableMakerFeeTokenAmount = zero;
            remainingMakeAssetAmount = signedOrder.makerAssetAmount;
            calculator = new remaining_fillable_calculator_1.RemainingFillableCalculator(signedOrder.makerFee, signedOrder.makerAssetAmount, isPercentageFee, transferrableMakeAssetAmount, transferrableMakerFeeTokenAmount, remainingMakeAssetAmount);
            expect(calculator.computeRemainingFillable()).to.be.bignumber.equal(zero);
        });
        it('calculates the correct amount when balance is less than remaining fillable', function () {
            signedOrder = buildSignedOrder();
            var partiallyFilledAmount = web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(2), decimals);
            remainingMakeAssetAmount = signedOrder.makerAssetAmount.minus(partiallyFilledAmount);
            transferrableMakeAssetAmount = remainingMakeAssetAmount.minus(partiallyFilledAmount);
            calculator = new remaining_fillable_calculator_1.RemainingFillableCalculator(signedOrder.makerFee, signedOrder.makerAssetAmount, isPercentageFee, transferrableMakeAssetAmount, transferrableMakerFeeTokenAmount, remainingMakeAssetAmount);
            expect(calculator.computeRemainingFillable()).to.be.bignumber.equal(transferrableMakeAssetAmount);
        });
        describe('Order to Fee Ratio is < 1', function () {
            beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    _a = __read([
                        web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(3), decimals),
                        web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(6), decimals),
                        web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(6), decimals),
                    ], 3), makerAmount = _a[0], takerAmount = _a[1], makerFeeAmount = _a[2];
                    return [2 /*return*/];
                });
            }); });
            it('calculates the correct amount when funds unavailable', function () {
                signedOrder = buildSignedOrder();
                remainingMakeAssetAmount = signedOrder.makerAssetAmount;
                var transferredAmount = web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(2), decimals);
                transferrableMakeAssetAmount = remainingMakeAssetAmount.minus(transferredAmount);
                calculator = new remaining_fillable_calculator_1.RemainingFillableCalculator(signedOrder.makerFee, signedOrder.makerAssetAmount, isPercentageFee, transferrableMakeAssetAmount, transferrableMakerFeeTokenAmount, remainingMakeAssetAmount);
                expect(calculator.computeRemainingFillable()).to.be.bignumber.equal(transferrableMakeAssetAmount);
            });
        });
        describe('Ratio is not evenly divisible', function () {
            beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    _a = __read([
                        web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(3), decimals),
                        web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(7), decimals),
                        web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(7), decimals),
                    ], 3), makerAmount = _a[0], takerAmount = _a[1], makerFeeAmount = _a[2];
                    return [2 /*return*/];
                });
            }); });
            it('calculates the correct amount when funds unavailable', function () {
                signedOrder = buildSignedOrder();
                remainingMakeAssetAmount = signedOrder.makerAssetAmount;
                var transferredAmount = web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(2), decimals);
                transferrableMakeAssetAmount = remainingMakeAssetAmount.minus(transferredAmount);
                calculator = new remaining_fillable_calculator_1.RemainingFillableCalculator(signedOrder.makerFee, signedOrder.makerAssetAmount, isPercentageFee, transferrableMakeAssetAmount, transferrableMakerFeeTokenAmount, remainingMakeAssetAmount);
                var calculatedFillableAmount = calculator.computeRemainingFillable();
                expect(calculatedFillableAmount.isLessThanOrEqualTo(transferrableMakeAssetAmount)).to.be.true();
                expect(calculatedFillableAmount).to.be.bignumber.greaterThan(new utils_1.BigNumber(0));
                var orderToFeeRatio = signedOrder.makerAssetAmount.dividedBy(signedOrder.makerFee);
                var calculatedFeeAmount = calculatedFillableAmount.dividedBy(orderToFeeRatio);
                expect(calculatedFeeAmount).to.be.bignumber.lessThan(transferrableMakerFeeTokenAmount);
            });
        });
    });
    describe('Maker asset is fee asset', function () {
        before(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                isPercentageFee = true;
                return [2 /*return*/];
            });
        }); });
        it('calculates the correct amount when unfilled and funds available', function () {
            signedOrder = buildSignedOrder();
            transferrableMakeAssetAmount = makerAmount.plus(makerFeeAmount);
            transferrableMakerFeeTokenAmount = transferrableMakeAssetAmount;
            remainingMakeAssetAmount = signedOrder.makerAssetAmount;
            calculator = new remaining_fillable_calculator_1.RemainingFillableCalculator(signedOrder.makerFee, signedOrder.makerAssetAmount, isPercentageFee, transferrableMakeAssetAmount, transferrableMakerFeeTokenAmount, remainingMakeAssetAmount);
            expect(calculator.computeRemainingFillable()).to.be.bignumber.equal(remainingMakeAssetAmount);
        });
        it('calculates the correct amount when partially filled and funds available', function () {
            signedOrder = buildSignedOrder();
            remainingMakeAssetAmount = web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(1), decimals);
            calculator = new remaining_fillable_calculator_1.RemainingFillableCalculator(signedOrder.makerFee, signedOrder.makerAssetAmount, isPercentageFee, transferrableMakeAssetAmount, transferrableMakerFeeTokenAmount, remainingMakeAssetAmount);
            expect(calculator.computeRemainingFillable()).to.be.bignumber.equal(remainingMakeAssetAmount);
        });
        it('calculates the amount to be 0 when all fee funds are transferred', function () {
            signedOrder = buildSignedOrder();
            transferrableMakeAssetAmount = zero;
            transferrableMakerFeeTokenAmount = zero;
            remainingMakeAssetAmount = signedOrder.makerAssetAmount;
            calculator = new remaining_fillable_calculator_1.RemainingFillableCalculator(signedOrder.makerFee, signedOrder.makerAssetAmount, isPercentageFee, transferrableMakeAssetAmount, transferrableMakerFeeTokenAmount, remainingMakeAssetAmount);
            expect(calculator.computeRemainingFillable()).to.be.bignumber.equal(zero);
        });
        it('calculates the correct amount when balance is less than remaining fillable', function () {
            signedOrder = buildSignedOrder();
            var partiallyFilledAmount = web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(2), decimals);
            remainingMakeAssetAmount = signedOrder.makerAssetAmount.minus(partiallyFilledAmount);
            transferrableMakeAssetAmount = remainingMakeAssetAmount.minus(partiallyFilledAmount);
            transferrableMakerFeeTokenAmount = transferrableMakeAssetAmount;
            var orderToFeeRatio = signedOrder.makerAssetAmount.dividedToIntegerBy(signedOrder.makerFee);
            var expectedFillableAmount = new utils_1.BigNumber(450980);
            calculator = new remaining_fillable_calculator_1.RemainingFillableCalculator(signedOrder.makerFee, signedOrder.makerAssetAmount, isPercentageFee, transferrableMakeAssetAmount, transferrableMakerFeeTokenAmount, remainingMakeAssetAmount);
            var calculatedFillableAmount = calculator.computeRemainingFillable();
            var numberOfFillsInRatio = calculatedFillableAmount.dividedToIntegerBy(orderToFeeRatio);
            var calculatedFillableAmountPlusFees = calculatedFillableAmount.plus(numberOfFillsInRatio);
            expect(calculatedFillableAmountPlusFees).to.be.bignumber.lessThan(transferrableMakeAssetAmount);
            expect(calculatedFillableAmountPlusFees).to.be.bignumber.lessThan(remainingMakeAssetAmount);
            expect(calculatedFillableAmount).to.be.bignumber.equal(expectedFillableAmount);
            expect(numberOfFillsInRatio.decimalPlaces()).to.be.equal(0);
        });
    });
});
//# sourceMappingURL=remaining_fillable_calculator_test.js.map