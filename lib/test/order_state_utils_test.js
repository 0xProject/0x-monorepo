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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var contract_wrappers_1 = require("@0x/contract-wrappers");
var contracts_test_utils_1 = require("@0x/contracts-test-utils");
var dev_utils_1 = require("@0x/dev-utils");
var migrations_1 = require("@0x/migrations");
var order_utils_1 = require("@0x/order-utils");
var utils_1 = require("@0x/utils");
var chai = require("chai");
require("mocha");
var constants_1 = require("../src/constants");
var order_state_utils_1 = require("../src/utils/order_state_utils");
var chai_setup_1 = require("./utils/chai_setup");
var web3_wrapper_1 = require("./utils/web3_wrapper");
chai_setup_1.chaiSetup.configure();
var expect = chai.expect;
var blockchainLifecycle = new dev_utils_1.BlockchainLifecycle(web3_wrapper_1.web3Wrapper);
var ONE_ETH_IN_WEI = new utils_1.BigNumber(1000000000000000000);
var TESTRPC_CHAIN_ID = contracts_test_utils_1.constants.TESTRPC_CHAIN_ID;
var GAS_PRICE = new utils_1.BigNumber(contracts_test_utils_1.constants.DEFAULT_GAS_PRICE);
var PROTOCOL_FEE_MULTIPLIER = 150000;
var PROTOCOL_FEE_PER_FILL = GAS_PRICE.times(PROTOCOL_FEE_MULTIPLIER);
var UNLIMITED_ALLOWANCE_IN_BASE_UNITS = new utils_1.BigNumber(2).pow(256).minus(1); // tslint:disable-line:custom-no-magic-numbers
var isSignedOrdersWithFillableAmountsNotFillable = function (signedOrders) {
    signedOrders.forEach(function (order) {
        expect(order.fillableMakerAssetAmount).to.bignumber.eq(constants_1.constants.ZERO_AMOUNT);
        expect(order.fillableTakerAssetAmount).to.bignumber.eq(constants_1.constants.ZERO_AMOUNT);
        expect(order.fillableTakerFeeAmount).to.bignumber.eq(constants_1.constants.ZERO_AMOUNT);
    });
};
// tslint:disable: no-unused-expression
// tslint:disable: custom-no-magic-numbers
describe('OrderStateUtils', function () {
    var erc20MakerTokenContract;
    var erc20TakerTokenContract;
    var exchangeContract;
    var userAddresses;
    var coinbaseAddress;
    var makerAddress;
    var takerAddress;
    var feeRecipient;
    var makerTokenAddress;
    var takerTokenAddress;
    var makerAssetData;
    var takerAssetData;
    var orderFactory;
    var wethAssetData;
    var contractAddresses;
    var orderStateUtils;
    var expiredOpenSignedOrder;
    var invalidSignatureOpenSignedOrder;
    var fullyFillableOpenSignedOrder;
    var partiallyFilledOpenSignedOrderFeeless;
    var partiallyFilledOpenSignedOrderFeeInTakerAsset;
    var partiallyFilledOpenSignedOrderFeeInMakerAsset;
    var filledOpenSignedOrder;
    var chainId = TESTRPC_CHAIN_ID;
    var fillableAmount = new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI);
    var partialFillAmount = new utils_1.BigNumber(2).multipliedBy(ONE_ETH_IN_WEI);
    var takerFeeAmount = new utils_1.BigNumber(2).multipliedBy(ONE_ETH_IN_WEI);
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b, _c, defaultOrderParams, privateKey;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, migrations_1.migrateOnceAsync(web3_wrapper_1.provider)];
                case 1:
                    contractAddresses = _d.sent();
                    return [4 /*yield*/, blockchainLifecycle.startAsync()];
                case 2:
                    _d.sent();
                    return [4 /*yield*/, web3_wrapper_1.web3Wrapper.getAvailableAddressesAsync()];
                case 3:
                    userAddresses = _d.sent();
                    _a = __read(userAddresses, 4), coinbaseAddress = _a[0], takerAddress = _a[1], makerAddress = _a[2], feeRecipient = _a[3];
                    _b = __read(dev_utils_1.tokenUtils.getDummyERC20TokenAddresses(), 2), makerTokenAddress = _b[0], takerTokenAddress = _b[1];
                    erc20MakerTokenContract = new contract_wrappers_1.ERC20TokenContract(makerTokenAddress, web3_wrapper_1.provider);
                    erc20TakerTokenContract = new contract_wrappers_1.ERC20TokenContract(takerTokenAddress, web3_wrapper_1.provider);
                    exchangeContract = new contract_wrappers_1.ExchangeContract(contractAddresses.exchange, web3_wrapper_1.provider);
                    _c = __read([
                        order_utils_1.assetDataUtils.encodeERC20AssetData(makerTokenAddress),
                        order_utils_1.assetDataUtils.encodeERC20AssetData(takerTokenAddress),
                        order_utils_1.assetDataUtils.encodeERC20AssetData(contractAddresses.etherToken),
                    ], 3), makerAssetData = _c[0], takerAssetData = _c[1], wethAssetData = _c[2];
                    defaultOrderParams = __assign({}, contracts_test_utils_1.constants.STATIC_ORDER_PARAMS, { makerAddress: makerAddress, takerAddress: constants_1.constants.NULL_ADDRESS, makerAssetData: makerAssetData,
                        takerAssetData: takerAssetData, makerFeeAssetData: constants_1.constants.NULL_ERC20_ASSET_DATA, takerFeeAssetData: constants_1.constants.NULL_ERC20_ASSET_DATA, makerFee: constants_1.constants.ZERO_AMOUNT, takerFee: constants_1.constants.ZERO_AMOUNT, feeRecipientAddress: feeRecipient, exchangeAddress: contractAddresses.exchange, chainId: chainId });
                    privateKey = contracts_test_utils_1.constants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(makerAddress)];
                    orderFactory = new contracts_test_utils_1.OrderFactory(privateKey, defaultOrderParams);
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
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, blockchainLifecycle.startAsync()];
                case 1:
                    _e.sent();
                    _b = (_a = orderFactory).newSignedOrderAsync;
                    _c = {};
                    _d = utils_1.BigNumber.bind;
                    return [4 /*yield*/, contracts_test_utils_1.getLatestBlockTimestampAsync()];
                case 2: return [4 /*yield*/, _b.apply(_a, [(_c.expirationTimeSeconds = new (_d.apply(utils_1.BigNumber, [void 0, _e.sent()]))().minus(10),
                            _c)])];
                case 3:
                    expiredOpenSignedOrder = _e.sent();
                    return [4 /*yield*/, orderFactory.newSignedOrderAsync({
                            takerAddress: takerAddress,
                        })];
                case 4:
                    invalidSignatureOpenSignedOrder = _e.sent();
                    invalidSignatureOpenSignedOrder.signature = expiredOpenSignedOrder.signature;
                    return [4 /*yield*/, orderFactory.newSignedOrderAsync({
                            takerAssetAmount: fillableAmount,
                            makerAssetAmount: fillableAmount,
                        })];
                case 5:
                    fullyFillableOpenSignedOrder = _e.sent();
                    // give double fillableAmount to maker and taker as buffer
                    return [4 /*yield*/, erc20MakerTokenContract
                            .transfer(makerAddress, fillableAmount.multipliedBy(4))
                            .sendTransactionAsync({ from: coinbaseAddress })];
                case 6:
                    // give double fillableAmount to maker and taker as buffer
                    _e.sent();
                    return [4 /*yield*/, erc20TakerTokenContract
                            .transfer(takerAddress, fillableAmount.multipliedBy(4))
                            .sendTransactionAsync({ from: coinbaseAddress })];
                case 7:
                    _e.sent();
                    return [4 /*yield*/, erc20MakerTokenContract
                            .approve(contractAddresses.erc20Proxy, UNLIMITED_ALLOWANCE_IN_BASE_UNITS)
                            .sendTransactionAsync({ from: makerAddress })];
                case 8:
                    _e.sent();
                    return [4 /*yield*/, erc20MakerTokenContract
                            .approve(contractAddresses.erc20Proxy, UNLIMITED_ALLOWANCE_IN_BASE_UNITS)
                            .sendTransactionAsync({ from: takerAddress })];
                case 9:
                    _e.sent();
                    return [4 /*yield*/, erc20TakerTokenContract
                            .approve(contractAddresses.erc20Proxy, UNLIMITED_ALLOWANCE_IN_BASE_UNITS)
                            .sendTransactionAsync({ from: takerAddress })];
                case 10:
                    _e.sent();
                    return [4 /*yield*/, orderFactory.newSignedOrderAsync({
                            takerAssetAmount: fillableAmount,
                            makerAssetAmount: fillableAmount,
                        })];
                case 11:
                    partiallyFilledOpenSignedOrderFeeless = _e.sent();
                    return [4 /*yield*/, exchangeContract
                            .fillOrKillOrder(partiallyFilledOpenSignedOrderFeeless, partialFillAmount, partiallyFilledOpenSignedOrderFeeless.signature)
                            .sendTransactionAsync({
                            from: takerAddress,
                            gasPrice: GAS_PRICE,
                            gas: 4000000,
                            value: PROTOCOL_FEE_PER_FILL,
                        })];
                case 12:
                    _e.sent();
                    return [4 /*yield*/, orderFactory.newSignedOrderAsync({
                            takerAssetAmount: fillableAmount,
                            makerAssetAmount: fillableAmount,
                            takerFee: takerFeeAmount,
                            takerFeeAssetData: takerAssetData,
                        })];
                case 13:
                    partiallyFilledOpenSignedOrderFeeInTakerAsset = _e.sent();
                    return [4 /*yield*/, exchangeContract
                            .fillOrKillOrder(partiallyFilledOpenSignedOrderFeeInTakerAsset, partialFillAmount, partiallyFilledOpenSignedOrderFeeInTakerAsset.signature)
                            .sendTransactionAsync({
                            from: takerAddress,
                            gasPrice: GAS_PRICE,
                            gas: 4000000,
                            value: PROTOCOL_FEE_PER_FILL,
                        })];
                case 14:
                    _e.sent();
                    return [4 /*yield*/, orderFactory.newSignedOrderAsync({
                            takerAssetAmount: fillableAmount,
                            makerAssetAmount: fillableAmount,
                            takerFee: takerFeeAmount,
                            takerFeeAssetData: makerAssetData,
                        })];
                case 15:
                    partiallyFilledOpenSignedOrderFeeInMakerAsset = _e.sent();
                    return [4 /*yield*/, exchangeContract
                            .fillOrKillOrder(partiallyFilledOpenSignedOrderFeeInMakerAsset, partialFillAmount, partiallyFilledOpenSignedOrderFeeInMakerAsset.signature)
                            .sendTransactionAsync({
                            from: takerAddress,
                            gasPrice: GAS_PRICE,
                            gas: 4000000,
                            value: PROTOCOL_FEE_PER_FILL,
                        })];
                case 16:
                    _e.sent();
                    return [4 /*yield*/, orderFactory.newSignedOrderAsync({
                            takerAssetAmount: fillableAmount,
                            makerAssetAmount: fillableAmount,
                        })];
                case 17:
                    filledOpenSignedOrder = _e.sent();
                    return [4 /*yield*/, exchangeContract
                            .fillOrKillOrder(filledOpenSignedOrder, fillableAmount, filledOpenSignedOrder.signature)
                            .sendTransactionAsync({
                            from: takerAddress,
                            gasPrice: GAS_PRICE,
                            gas: 4000000,
                            value: PROTOCOL_FEE_PER_FILL,
                        })];
                case 18:
                    _e.sent();
                    orderStateUtils = new order_state_utils_1.OrderStateUtils(new contract_wrappers_1.DevUtilsContract(contractAddresses.devUtils, web3_wrapper_1.provider));
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
    describe('#getSignedOrdersWithFillableAmountsAsync', function () {
        it('should 0 fillableTakerAssetAmount for expired orders', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, resultOrders;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orders = [expiredOpenSignedOrder];
                        return [4 /*yield*/, orderStateUtils.getSignedOrdersWithFillableAmountsAsync(orders)];
                    case 1:
                        resultOrders = _a.sent();
                        isSignedOrdersWithFillableAmountsNotFillable(resultOrders);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should filter out invalid signature orders', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, resultOrders;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orders = [invalidSignatureOpenSignedOrder];
                        return [4 /*yield*/, orderStateUtils.getSignedOrdersWithFillableAmountsAsync(orders)];
                    case 1:
                        resultOrders = _a.sent();
                        isSignedOrdersWithFillableAmountsNotFillable(resultOrders);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return 0 fillableTakerAssetAmount for fully filled orders', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, resultOrders;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orders = [filledOpenSignedOrder];
                        return [4 /*yield*/, orderStateUtils.getSignedOrdersWithFillableAmountsAsync(orders)];
                    case 1:
                        resultOrders = _a.sent();
                        isSignedOrdersWithFillableAmountsNotFillable(resultOrders);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should provide correct pruned signed orders for fully fillable orders', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, resultOrders, order;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orders = [fullyFillableOpenSignedOrder];
                        return [4 /*yield*/, orderStateUtils.getSignedOrdersWithFillableAmountsAsync(orders)];
                    case 1:
                        resultOrders = _a.sent();
                        order = resultOrders[0];
                        expect(order.fillableMakerAssetAmount).to.bignumber.equal(fillableAmount);
                        expect(order.fillableTakerAssetAmount).to.bignumber.equal(fillableAmount);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should provide correct pruned signed orders for partially fillable orders', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, resultOrders;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orders = [
                            partiallyFilledOpenSignedOrderFeeless,
                            partiallyFilledOpenSignedOrderFeeInTakerAsset,
                            partiallyFilledOpenSignedOrderFeeInMakerAsset,
                        ];
                        return [4 /*yield*/, orderStateUtils.getSignedOrdersWithFillableAmountsAsync(orders)];
                    case 1:
                        resultOrders = _a.sent();
                        expect(resultOrders[0].fillableMakerAssetAmount).to.bignumber.equal(fillableAmount.minus(partialFillAmount));
                        expect(resultOrders[0].fillableTakerAssetAmount).to.bignumber.equal(fillableAmount.minus(partialFillAmount));
                        expect(resultOrders[1].fillableMakerAssetAmount).to.bignumber.equal(fillableAmount.minus(partialFillAmount));
                        expect(resultOrders[1].fillableTakerAssetAmount).to.bignumber.equal(fillableAmount.minus(partialFillAmount));
                        expect(resultOrders[1].fillableTakerFeeAmount).to.bignumber.equal(new utils_1.BigNumber(1.6).multipliedBy(ONE_ETH_IN_WEI));
                        expect(resultOrders[2].fillableMakerAssetAmount).to.bignumber.equal(fillableAmount.minus(partialFillAmount));
                        expect(resultOrders[2].fillableTakerAssetAmount).to.bignumber.equal(fillableAmount.minus(partialFillAmount));
                        expect(resultOrders[2].fillableTakerFeeAmount).to.bignumber.equal(new utils_1.BigNumber(1.6).multipliedBy(ONE_ETH_IN_WEI));
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=order_state_utils_test.js.map