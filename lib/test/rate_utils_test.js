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
var chai_setup_1 = require("./utils/chai_setup");
var test_order_factory_1 = require("./utils/test_order_factory");
chai_setup_1.chaiSetup.configure();
var expect = chai.expect;
describe('rateUtils', function () {
    var testOrder = test_order_factory_1.testOrderFactory.generateTestSignedOrder({
        makerAssetAmount: new utils_1.BigNumber(100),
        takerAssetAmount: new utils_1.BigNumber(100),
        takerFee: new utils_1.BigNumber(20),
    });
    describe('#getFeeAdjustedRateOfOrder', function () {
        it('throws when feeRate is less than zero', function () { return __awaiter(_this, void 0, void 0, function () {
            var feeRate;
            return __generator(this, function (_a) {
                feeRate = new utils_1.BigNumber(-1);
                expect(function () { return src_1.rateUtils.getFeeAdjustedRateOfOrder(testOrder, feeRate); }).to.throw('Expected feeRate: -1 to be greater than or equal to 0');
                return [2 /*return*/];
            });
        }); });
        it('correctly calculates fee adjusted rate when feeRate is provided', function () { return __awaiter(_this, void 0, void 0, function () {
            var feeRate, feeAdjustedRate;
            return __generator(this, function (_a) {
                feeRate = new utils_1.BigNumber(2);
                feeAdjustedRate = src_1.rateUtils.getFeeAdjustedRateOfOrder(testOrder, feeRate);
                // the order actually takes 100 + (2 * 20) takerAsset units to fill 100 units of makerAsset
                expect(feeAdjustedRate).to.bignumber.equal(new utils_1.BigNumber(1.4));
                return [2 /*return*/];
            });
        }); });
        it('correctly calculates fee adjusted rate when no feeRate is provided', function () { return __awaiter(_this, void 0, void 0, function () {
            var feeAdjustedRate;
            return __generator(this, function (_a) {
                feeAdjustedRate = src_1.rateUtils.getFeeAdjustedRateOfOrder(testOrder);
                // because no feeRate was provided we just assume 0 fees
                // the order actually takes 100 takerAsset units to fill 100 units of makerAsset
                expect(feeAdjustedRate).to.bignumber.equal(new utils_1.BigNumber(1));
                return [2 /*return*/];
            });
        }); });
    });
    describe('#getFeeAdjustedRateOfFeeOrder', function () {
        it('throws when takerFee exceeds makerAssetAmount', function () { return __awaiter(_this, void 0, void 0, function () {
            var badOrder;
            return __generator(this, function (_a) {
                badOrder = test_order_factory_1.testOrderFactory.generateTestSignedOrder({
                    makerAssetAmount: new utils_1.BigNumber(100),
                    takerFee: new utils_1.BigNumber(101),
                });
                expect(function () { return src_1.rateUtils.getFeeAdjustedRateOfFeeOrder(badOrder); }).to.throw('Expected takerFee: "101" to be less than makerAssetAmount: "100"');
                return [2 /*return*/];
            });
        }); });
        it('correctly calculates fee adjusted rate', function () { return __awaiter(_this, void 0, void 0, function () {
            var feeAdjustedRate;
            return __generator(this, function (_a) {
                feeAdjustedRate = src_1.rateUtils.getFeeAdjustedRateOfFeeOrder(testOrder);
                // the order actually takes 100 takerAsset units to fill (100 - 20) units of makerAsset
                expect(feeAdjustedRate).to.bignumber.equal(new utils_1.BigNumber(1.25));
                return [2 /*return*/];
            });
        }); });
    });
});
//# sourceMappingURL=rate_utils_test.js.map