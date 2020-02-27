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
var sorting_utils_1 = require("../src/utils/sorting_utils");
var chai_setup_1 = require("./utils/chai_setup");
var test_order_factory_1 = require("./utils/test_order_factory");
chai_setup_1.chaiSetup.configure();
var expect = chai.expect;
var FAKE_ERC20_TAKER_ASSET_DATA = '0xf47261b02222222222222222222222222222222222222222222222222222222222222222';
var FAKE_ERC20_MAKER_ASSET_DATA = '0xf47261b01111111111111111111111111111111111111111111111111111111111111111';
describe('sortingUtils', function () {
    describe('#sortOrders', function () {
        // rate: 2 takerAsset / makerAsset
        var testOrder1 = test_order_factory_1.testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new utils_1.BigNumber(100),
            takerAssetAmount: new utils_1.BigNumber(200),
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        // rate: 1 takerAsset / makerAsset
        var testOrder2 = test_order_factory_1.testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new utils_1.BigNumber(100),
            takerAssetAmount: new utils_1.BigNumber(100),
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        // rate: 2.5 takerAsset / makerAsset
        var testOrder3 = test_order_factory_1.testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new utils_1.BigNumber(100),
            takerAssetAmount: new utils_1.BigNumber(250),
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        // rate: 2 takerAsset / makerAsset
        var testOrderWithFeeInTakerAsset1 = test_order_factory_1.testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new utils_1.BigNumber(100),
            takerAssetAmount: new utils_1.BigNumber(100),
            takerFee: new utils_1.BigNumber(100),
            takerFeeAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        // rate: 1 takerAsset / makerAsset
        var testOrderWithFeeInTakerAsset2 = test_order_factory_1.testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new utils_1.BigNumber(100),
            takerAssetAmount: new utils_1.BigNumber(50),
            takerFee: new utils_1.BigNumber(50),
            takerFeeAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        // rate: 2.5 takerAsset / makerAsset
        var testOrderWithFeeInTakerAsset3 = test_order_factory_1.testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new utils_1.BigNumber(100),
            takerAssetAmount: new utils_1.BigNumber(200),
            takerFee: new utils_1.BigNumber(50),
            takerFeeAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        // rate: 2 takerAsset / makerAsset
        var testOrderWithFeeInMakerAsset1 = test_order_factory_1.testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new utils_1.BigNumber(200),
            takerAssetAmount: new utils_1.BigNumber(200),
            takerFee: new utils_1.BigNumber(100),
            takerFeeAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        // rate: 1 takerAsset / makerAsset
        var testOrderWithFeeInMakerAsset2 = test_order_factory_1.testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new utils_1.BigNumber(150),
            takerAssetAmount: new utils_1.BigNumber(100),
            takerFee: new utils_1.BigNumber(50),
            takerFeeAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        // rate: 2.5 takerAsset / makerAsset
        var testOrderWithFeeInMakerAsset3 = test_order_factory_1.testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new utils_1.BigNumber(150),
            takerAssetAmount: new utils_1.BigNumber(250),
            takerFee: new utils_1.BigNumber(50),
            takerFeeAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        it('correctly sorts by fee adjusted rate (feeless orders)', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, sortedOrders;
            return __generator(this, function (_a) {
                orders = [testOrder1, testOrder2, testOrder3];
                sortedOrders = sorting_utils_1.sortingUtils.sortOrders(orders);
                expect(sortedOrders).to.deep.equal([testOrder2, testOrder1, testOrder3]);
                return [2 /*return*/];
            });
        }); });
        it('correctly sorts by fee adjusted rate (takerAsset denominated fee orders)', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, sortedOrders;
            return __generator(this, function (_a) {
                orders = [
                    testOrderWithFeeInTakerAsset1,
                    testOrderWithFeeInTakerAsset2,
                    testOrderWithFeeInTakerAsset3,
                ];
                sortedOrders = sorting_utils_1.sortingUtils.sortOrders(orders);
                expect(sortedOrders).to.deep.equal([
                    testOrderWithFeeInTakerAsset2,
                    testOrderWithFeeInTakerAsset1,
                    testOrderWithFeeInTakerAsset3,
                ]);
                return [2 /*return*/];
            });
        }); });
        it('correctly sorts by fee adjusted rate (makerAsset denominated fee orders)', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, sortedOrders;
            return __generator(this, function (_a) {
                orders = [
                    testOrderWithFeeInMakerAsset1,
                    testOrderWithFeeInMakerAsset2,
                    testOrderWithFeeInMakerAsset3,
                ];
                sortedOrders = sorting_utils_1.sortingUtils.sortOrders(orders);
                expect(sortedOrders).to.deep.equal([
                    testOrderWithFeeInMakerAsset2,
                    testOrderWithFeeInMakerAsset1,
                    testOrderWithFeeInMakerAsset3,
                ]);
                return [2 /*return*/];
            });
        }); });
        it('correctly sorts by fee adjusted rate (mixed orders)', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, sortedOrders;
            return __generator(this, function (_a) {
                orders = [testOrderWithFeeInMakerAsset1, testOrderWithFeeInTakerAsset2, testOrder3];
                sortedOrders = sorting_utils_1.sortingUtils.sortOrders(orders);
                expect(sortedOrders).to.deep.equal([
                    testOrderWithFeeInTakerAsset2,
                    testOrderWithFeeInMakerAsset1,
                    testOrder3,
                ]);
                return [2 /*return*/];
            });
        }); });
    });
});
//# sourceMappingURL=sorting_utils_test.js.map