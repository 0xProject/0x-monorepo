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
var contract_wrappers_1 = require("@0x/contract-wrappers");
var contracts_test_utils_1 = require("@0x/contracts-test-utils");
var dev_utils_1 = require("@0x/dev-utils");
var migrations_1 = require("@0x/migrations");
var order_utils_1 = require("@0x/order-utils");
var utils_1 = require("@0x/utils");
var chai = require("chai");
require("mocha");
var src_1 = require("../src");
var constants_1 = require("../src/constants");
var types_1 = require("../src/types");
var protocol_fee_utils_1 = require("../src/utils/protocol_fee_utils");
var chai_setup_1 = require("./utils/chai_setup");
var swap_quote_1 = require("./utils/swap_quote");
var web3_wrapper_1 = require("./utils/web3_wrapper");
chai_setup_1.chaiSetup.configure();
var expect = chai.expect;
var blockchainLifecycle = new dev_utils_1.BlockchainLifecycle(web3_wrapper_1.web3Wrapper);
var ONE_ETH_IN_WEI = new utils_1.BigNumber(1000000000000000000);
var TESTRPC_CHAIN_ID = 1337;
var GAS_PRICE = new utils_1.BigNumber(contracts_test_utils_1.constants.DEFAULT_GAS_PRICE);
var PARTIAL_PRUNED_SIGNED_ORDERS = [
    {
        takerAssetAmount: new utils_1.BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new utils_1.BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new utils_1.BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new utils_1.BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
    },
    {
        takerAssetAmount: new utils_1.BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new utils_1.BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new utils_1.BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new utils_1.BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
    },
    {
        takerAssetAmount: new utils_1.BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new utils_1.BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new utils_1.BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new utils_1.BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
    },
];
var PARTIAL_LARGE_PRUNED_SIGNED_ORDERS = [
    {
        takerAssetAmount: new utils_1.BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new utils_1.BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new utils_1.BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new utils_1.BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
    },
    {
        takerAssetAmount: new utils_1.BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new utils_1.BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new utils_1.BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new utils_1.BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
    },
    {
        takerAssetAmount: new utils_1.BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new utils_1.BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new utils_1.BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new utils_1.BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
    },
];
describe('swapQuoteConsumerUtils', function () {
    var wethContract;
    var protocolFeeUtils;
    var userAddresses;
    var makerAddress;
    var takerAddress;
    var makerTokenAddress;
    var takerTokenAddress;
    var makerAssetData;
    var takerAssetData;
    var wethAssetData;
    var contractAddresses;
    var swapQuoteConsumer;
    var orderFactory;
    var forwarderOrderFactory;
    var chainId = TESTRPC_CHAIN_ID;
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b, _c, defaultOrderParams, defaultForwarderOrderParams, privateKey;
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
                    wethContract = new contract_wrappers_1.WETH9Contract(contractAddresses.etherToken, web3_wrapper_1.provider);
                    _a = __read(userAddresses, 2), takerAddress = _a[0], makerAddress = _a[1];
                    _b = __read(dev_utils_1.tokenUtils.getDummyERC20TokenAddresses(), 2), makerTokenAddress = _b[0], takerTokenAddress = _b[1];
                    _c = __read([
                        order_utils_1.assetDataUtils.encodeERC20AssetData(makerTokenAddress),
                        order_utils_1.assetDataUtils.encodeERC20AssetData(takerTokenAddress),
                        order_utils_1.assetDataUtils.encodeERC20AssetData(contractAddresses.etherToken),
                    ], 3), makerAssetData = _c[0], takerAssetData = _c[1], wethAssetData = _c[2];
                    defaultOrderParams = __assign({}, contracts_test_utils_1.constants.STATIC_ORDER_PARAMS, { makerAddress: makerAddress, takerAddress: constants_1.constants.NULL_ADDRESS, makerAssetData: makerAssetData,
                        takerAssetData: takerAssetData, makerFeeAssetData: constants_1.constants.NULL_ERC20_ASSET_DATA, takerFeeAssetData: constants_1.constants.NULL_ERC20_ASSET_DATA, makerFee: constants_1.constants.ZERO_AMOUNT, takerFee: constants_1.constants.ZERO_AMOUNT, feeRecipientAddress: constants_1.constants.NULL_ADDRESS, exchangeAddress: contractAddresses.exchange, chainId: chainId });
                    defaultForwarderOrderParams = __assign({}, defaultOrderParams, {
                        takerAssetData: wethAssetData,
                    });
                    privateKey = contracts_test_utils_1.constants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(makerAddress)];
                    orderFactory = new contracts_test_utils_1.OrderFactory(privateKey, defaultOrderParams);
                    protocolFeeUtils = new protocol_fee_utils_1.ProtocolFeeUtils(constants_1.constants.PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS, new utils_1.BigNumber(1));
                    forwarderOrderFactory = new contracts_test_utils_1.OrderFactory(privateKey, defaultForwarderOrderParams);
                    swapQuoteConsumer = new src_1.SwapQuoteConsumer(web3_wrapper_1.provider, {
                        chainId: chainId,
                    });
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
                    return [4 /*yield*/, protocolFeeUtils.destroyAsync()];
                case 2:
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
    describe('getConsumerTypeForSwapQuoteAsync', function () {
        var forwarderOrders;
        var exchangeOrders;
        var largeForwarderOrders;
        var forwarderSwapQuote;
        var exchangeSwapQuote;
        var largeForwarderSwapQuote;
        beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
            var e_1, _a, e_2, _b, e_3, _c, PARTIAL_PRUNED_SIGNED_ORDERS_1, PARTIAL_PRUNED_SIGNED_ORDERS_1_1, partialOrder, order, prunedOrder, e_1_1, PARTIAL_PRUNED_SIGNED_ORDERS_2, PARTIAL_PRUNED_SIGNED_ORDERS_2_1, partialOrder, order, prunedOrder, e_2_1, PARTIAL_LARGE_PRUNED_SIGNED_ORDERS_1, PARTIAL_LARGE_PRUNED_SIGNED_ORDERS_1_1, partialOrder, order, prunedOrder, e_3_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        exchangeOrders = [];
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        PARTIAL_PRUNED_SIGNED_ORDERS_1 = __values(PARTIAL_PRUNED_SIGNED_ORDERS), PARTIAL_PRUNED_SIGNED_ORDERS_1_1 = PARTIAL_PRUNED_SIGNED_ORDERS_1.next();
                        _d.label = 2;
                    case 2:
                        if (!!PARTIAL_PRUNED_SIGNED_ORDERS_1_1.done) return [3 /*break*/, 5];
                        partialOrder = PARTIAL_PRUNED_SIGNED_ORDERS_1_1.value;
                        return [4 /*yield*/, orderFactory.newSignedOrderAsync(partialOrder)];
                    case 3:
                        order = _d.sent();
                        prunedOrder = __assign({}, order, partialOrder);
                        exchangeOrders.push(prunedOrder);
                        _d.label = 4;
                    case 4:
                        PARTIAL_PRUNED_SIGNED_ORDERS_1_1 = PARTIAL_PRUNED_SIGNED_ORDERS_1.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_1_1 = _d.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (PARTIAL_PRUNED_SIGNED_ORDERS_1_1 && !PARTIAL_PRUNED_SIGNED_ORDERS_1_1.done && (_a = PARTIAL_PRUNED_SIGNED_ORDERS_1.return)) _a.call(PARTIAL_PRUNED_SIGNED_ORDERS_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 8:
                        forwarderOrders = [];
                        _d.label = 9;
                    case 9:
                        _d.trys.push([9, 14, 15, 16]);
                        PARTIAL_PRUNED_SIGNED_ORDERS_2 = __values(PARTIAL_PRUNED_SIGNED_ORDERS), PARTIAL_PRUNED_SIGNED_ORDERS_2_1 = PARTIAL_PRUNED_SIGNED_ORDERS_2.next();
                        _d.label = 10;
                    case 10:
                        if (!!PARTIAL_PRUNED_SIGNED_ORDERS_2_1.done) return [3 /*break*/, 13];
                        partialOrder = PARTIAL_PRUNED_SIGNED_ORDERS_2_1.value;
                        return [4 /*yield*/, forwarderOrderFactory.newSignedOrderAsync(partialOrder)];
                    case 11:
                        order = _d.sent();
                        prunedOrder = __assign({}, order, partialOrder);
                        forwarderOrders.push(prunedOrder);
                        _d.label = 12;
                    case 12:
                        PARTIAL_PRUNED_SIGNED_ORDERS_2_1 = PARTIAL_PRUNED_SIGNED_ORDERS_2.next();
                        return [3 /*break*/, 10];
                    case 13: return [3 /*break*/, 16];
                    case 14:
                        e_2_1 = _d.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 16];
                    case 15:
                        try {
                            if (PARTIAL_PRUNED_SIGNED_ORDERS_2_1 && !PARTIAL_PRUNED_SIGNED_ORDERS_2_1.done && (_b = PARTIAL_PRUNED_SIGNED_ORDERS_2.return)) _b.call(PARTIAL_PRUNED_SIGNED_ORDERS_2);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7 /*endfinally*/];
                    case 16:
                        largeForwarderOrders = [];
                        _d.label = 17;
                    case 17:
                        _d.trys.push([17, 22, 23, 24]);
                        PARTIAL_LARGE_PRUNED_SIGNED_ORDERS_1 = __values(PARTIAL_LARGE_PRUNED_SIGNED_ORDERS), PARTIAL_LARGE_PRUNED_SIGNED_ORDERS_1_1 = PARTIAL_LARGE_PRUNED_SIGNED_ORDERS_1.next();
                        _d.label = 18;
                    case 18:
                        if (!!PARTIAL_LARGE_PRUNED_SIGNED_ORDERS_1_1.done) return [3 /*break*/, 21];
                        partialOrder = PARTIAL_LARGE_PRUNED_SIGNED_ORDERS_1_1.value;
                        return [4 /*yield*/, forwarderOrderFactory.newSignedOrderAsync(partialOrder)];
                    case 19:
                        order = _d.sent();
                        prunedOrder = __assign({}, order, partialOrder);
                        largeForwarderOrders.push(prunedOrder);
                        _d.label = 20;
                    case 20:
                        PARTIAL_LARGE_PRUNED_SIGNED_ORDERS_1_1 = PARTIAL_LARGE_PRUNED_SIGNED_ORDERS_1.next();
                        return [3 /*break*/, 18];
                    case 21: return [3 /*break*/, 24];
                    case 22:
                        e_3_1 = _d.sent();
                        e_3 = { error: e_3_1 };
                        return [3 /*break*/, 24];
                    case 23:
                        try {
                            if (PARTIAL_LARGE_PRUNED_SIGNED_ORDERS_1_1 && !PARTIAL_LARGE_PRUNED_SIGNED_ORDERS_1_1.done && (_c = PARTIAL_LARGE_PRUNED_SIGNED_ORDERS_1.return)) _c.call(PARTIAL_LARGE_PRUNED_SIGNED_ORDERS_1);
                        }
                        finally { if (e_3) throw e_3.error; }
                        return [7 /*endfinally*/];
                    case 24: return [4 /*yield*/, swap_quote_1.getFullyFillableSwapQuoteWithNoFeesAsync(makerAssetData, wethAssetData, forwarderOrders, types_1.MarketOperation.Sell, GAS_PRICE, protocolFeeUtils)];
                    case 25:
                        forwarderSwapQuote = _d.sent();
                        return [4 /*yield*/, swap_quote_1.getFullyFillableSwapQuoteWithNoFeesAsync(makerAssetData, wethAssetData, largeForwarderOrders, types_1.MarketOperation.Sell, GAS_PRICE, protocolFeeUtils)];
                    case 26:
                        largeForwarderSwapQuote = _d.sent();
                        return [4 /*yield*/, swap_quote_1.getFullyFillableSwapQuoteWithNoFeesAsync(makerAssetData, takerAssetData, exchangeOrders, types_1.MarketOperation.Sell, GAS_PRICE, protocolFeeUtils)];
                    case 27:
                        exchangeSwapQuote = _d.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return exchange consumer if takerAsset is not wEth', function () { return __awaiter(_this, void 0, void 0, function () {
            var extensionContractType;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, swapQuoteConsumer.getOptimalExtensionContractTypeAsync(exchangeSwapQuote, { takerAddress: takerAddress })];
                    case 1:
                        extensionContractType = _a.sent();
                        expect(extensionContractType).to.equal(types_1.ExtensionContractType.None);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return forwarder consumer if takerAsset is wEth and have enough eth balance', function () { return __awaiter(_this, void 0, void 0, function () {
            var extensionContractType;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, swapQuoteConsumer.getOptimalExtensionContractTypeAsync(forwarderSwapQuote, { takerAddress: takerAddress })];
                    case 1:
                        extensionContractType = _a.sent();
                        expect(extensionContractType).to.equal(types_1.ExtensionContractType.Forwarder);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return exchange consumer if takerAsset is wEth and taker has enough weth', function () { return __awaiter(_this, void 0, void 0, function () {
            var etherInWei, extensionContractType;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        etherInWei = new utils_1.BigNumber(20).multipliedBy(ONE_ETH_IN_WEI);
                        return [4 /*yield*/, wethContract.deposit().sendTransactionAsync({ value: etherInWei, from: takerAddress })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, swapQuoteConsumer.getOptimalExtensionContractTypeAsync(forwarderSwapQuote, { takerAddress: takerAddress })];
                    case 2:
                        extensionContractType = _a.sent();
                        expect(extensionContractType).to.equal(types_1.ExtensionContractType.None);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return forwarder consumer if takerAsset is wEth and takerAddress has no available balance in either weth or eth (defaulting behavior)', function () { return __awaiter(_this, void 0, void 0, function () {
            var etherInWei, extensionContractType;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        etherInWei = new utils_1.BigNumber(50).multipliedBy(ONE_ETH_IN_WEI);
                        return [4 /*yield*/, wethContract.deposit().sendTransactionAsync({ value: etherInWei, from: takerAddress })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, swapQuoteConsumer.getOptimalExtensionContractTypeAsync(largeForwarderSwapQuote, { takerAddress: takerAddress })];
                    case 2:
                        extensionContractType = _a.sent();
                        expect(extensionContractType).to.equal(types_1.ExtensionContractType.Forwarder);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=swap_quote_consumer_utils_test.js.map