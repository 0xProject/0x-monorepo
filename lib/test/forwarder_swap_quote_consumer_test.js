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
var constants_1 = require("../src/constants");
var forwarder_swap_quote_consumer_1 = require("../src/quote_consumers/forwarder_swap_quote_consumer");
var types_1 = require("../src/types");
var protocol_fee_utils_1 = require("../src/utils/protocol_fee_utils");
var chai_setup_1 = require("./utils/chai_setup");
var swap_quote_1 = require("./utils/swap_quote");
var web3_wrapper_1 = require("./utils/web3_wrapper");
chai_setup_1.chaiSetup.configure();
var expect = chai.expect;
var blockchainLifecycle = new dev_utils_1.BlockchainLifecycle(web3_wrapper_1.web3Wrapper);
var GAS_PRICE = new utils_1.BigNumber(contracts_test_utils_1.constants.DEFAULT_GAS_PRICE);
var ONE_ETH_IN_WEI = new utils_1.BigNumber(1000000000000000000);
var TESTRPC_CHAIN_ID = contracts_test_utils_1.constants.TESTRPC_CHAIN_ID;
var UNLIMITED_ALLOWANCE_IN_BASE_UNITS = new utils_1.BigNumber(2).pow(256).minus(1); // tslint:disable-line:custom-no-magic-numbers
var FEE_PERCENTAGE = 0.05;
var PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS = [
    {
        takerAssetAmount: new utils_1.BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new utils_1.BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new utils_1.BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new utils_1.BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
    },
    {
        takerAssetAmount: new utils_1.BigNumber(1).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new utils_1.BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new utils_1.BigNumber(1).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new utils_1.BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
    },
    {
        takerAssetAmount: new utils_1.BigNumber(1).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new utils_1.BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new utils_1.BigNumber(1).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new utils_1.BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
    },
];
var expectMakerAndTakerBalancesAsyncFactory = function (erc20TokenContract, makerAddress, takerAddress) { return function (expectedMakerBalance, expectedTakerBalance) { return __awaiter(_this, void 0, void 0, function () {
    var makerBalance, takerBalance;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, erc20TokenContract.balanceOf(makerAddress).callAsync()];
            case 1:
                makerBalance = _a.sent();
                return [4 /*yield*/, erc20TokenContract.balanceOf(takerAddress).callAsync()];
            case 2:
                takerBalance = _a.sent();
                expect(makerBalance).to.bignumber.equal(expectedMakerBalance);
                expect(takerBalance).to.bignumber.equal(expectedTakerBalance);
                return [2 /*return*/];
        }
    });
}); }; };
describe('ForwarderSwapQuoteConsumer', function () {
    var protocolFeeUtils;
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
    var invalidOrderFactory;
    var wethAssetData;
    var contractAddresses;
    var erc20TokenContract;
    var forwarderContract;
    var orders;
    var invalidOrders;
    var marketSellSwapQuote;
    var marketBuySwapQuote;
    var invalidMarketBuySwapQuote;
    var swapQuoteConsumer;
    var expectMakerAndTakerBalancesAsync;
    var chainId = TESTRPC_CHAIN_ID;
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b, _c, defaultOrderParams, invalidDefaultOrderParams, privateKey;
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
                    erc20TokenContract = new contract_wrappers_1.ERC20TokenContract(makerTokenAddress, web3_wrapper_1.provider);
                    forwarderContract = new contract_wrappers_1.ForwarderContract(contractAddresses.forwarder, web3_wrapper_1.provider);
                    _c = __read([
                        order_utils_1.assetDataUtils.encodeERC20AssetData(makerTokenAddress),
                        order_utils_1.assetDataUtils.encodeERC20AssetData(takerTokenAddress),
                        order_utils_1.assetDataUtils.encodeERC20AssetData(contractAddresses.etherToken),
                    ], 3), makerAssetData = _c[0], takerAssetData = _c[1], wethAssetData = _c[2];
                    defaultOrderParams = __assign({}, contracts_test_utils_1.constants.STATIC_ORDER_PARAMS, { makerAddress: makerAddress, takerAddress: constants_1.constants.NULL_ADDRESS, makerAssetData: makerAssetData, takerAssetData: wethAssetData, makerFeeAssetData: constants_1.constants.NULL_ERC20_ASSET_DATA, takerFeeAssetData: constants_1.constants.NULL_ERC20_ASSET_DATA, makerFee: constants_1.constants.ZERO_AMOUNT, takerFee: constants_1.constants.ZERO_AMOUNT, feeRecipientAddress: feeRecipient, exchangeAddress: contractAddresses.exchange, chainId: chainId });
                    invalidDefaultOrderParams = __assign({}, defaultOrderParams, {
                        takerAssetData: takerAssetData,
                    });
                    privateKey = contracts_test_utils_1.constants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(makerAddress)];
                    orderFactory = new contracts_test_utils_1.OrderFactory(privateKey, defaultOrderParams);
                    protocolFeeUtils = new protocol_fee_utils_1.ProtocolFeeUtils(constants_1.constants.PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS, new utils_1.BigNumber(1));
                    expectMakerAndTakerBalancesAsync = expectMakerAndTakerBalancesAsyncFactory(erc20TokenContract, makerAddress, takerAddress);
                    invalidOrderFactory = new contracts_test_utils_1.OrderFactory(privateKey, invalidDefaultOrderParams);
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
        var e_1, _a, e_2, _b, UNLIMITED_ALLOWANCE, totalFillableAmount, PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1, PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1_1, partialOrder, order, prunedOrder, e_1_1, PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_2, PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_2_1, partialOrder, order, prunedOrder, e_2_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, blockchainLifecycle.startAsync()];
                case 1:
                    _c.sent();
                    UNLIMITED_ALLOWANCE = UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
                    totalFillableAmount = new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI);
                    return [4 /*yield*/, erc20TokenContract.transfer(makerAddress, totalFillableAmount).sendTransactionAsync({
                            from: coinbaseAddress,
                        })];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, erc20TokenContract
                            .approve(contractAddresses.erc20Proxy, UNLIMITED_ALLOWANCE)
                            .sendTransactionAsync({ from: makerAddress })];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, forwarderContract.approveMakerAssetProxy(makerAssetData).sendTransactionAsync({ from: makerAddress })];
                case 4:
                    _c.sent();
                    orders = [];
                    _c.label = 5;
                case 5:
                    _c.trys.push([5, 10, 11, 12]);
                    PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1 = __values(PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS), PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1_1 = PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1.next();
                    _c.label = 6;
                case 6:
                    if (!!PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1_1.done) return [3 /*break*/, 9];
                    partialOrder = PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1_1.value;
                    return [4 /*yield*/, orderFactory.newSignedOrderAsync(partialOrder)];
                case 7:
                    order = _c.sent();
                    prunedOrder = __assign({}, order, partialOrder);
                    orders.push(prunedOrder);
                    _c.label = 8;
                case 8:
                    PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1_1 = PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1.next();
                    return [3 /*break*/, 6];
                case 9: return [3 /*break*/, 12];
                case 10:
                    e_1_1 = _c.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 12];
                case 11:
                    try {
                        if (PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1_1 && !PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1_1.done && (_a = PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1.return)) _a.call(PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7 /*endfinally*/];
                case 12:
                    invalidOrders = [];
                    _c.label = 13;
                case 13:
                    _c.trys.push([13, 18, 19, 20]);
                    PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_2 = __values(PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS), PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_2_1 = PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_2.next();
                    _c.label = 14;
                case 14:
                    if (!!PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_2_1.done) return [3 /*break*/, 17];
                    partialOrder = PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_2_1.value;
                    return [4 /*yield*/, invalidOrderFactory.newSignedOrderAsync(partialOrder)];
                case 15:
                    order = _c.sent();
                    prunedOrder = __assign({}, order, partialOrder);
                    invalidOrders.push(prunedOrder);
                    _c.label = 16;
                case 16:
                    PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_2_1 = PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_2.next();
                    return [3 /*break*/, 14];
                case 17: return [3 /*break*/, 20];
                case 18:
                    e_2_1 = _c.sent();
                    e_2 = { error: e_2_1 };
                    return [3 /*break*/, 20];
                case 19:
                    try {
                        if (PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_2_1 && !PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_2_1.done && (_b = PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_2.return)) _b.call(PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_2);
                    }
                    finally { if (e_2) throw e_2.error; }
                    return [7 /*endfinally*/];
                case 20: return [4 /*yield*/, swap_quote_1.getFullyFillableSwapQuoteWithNoFeesAsync(makerAssetData, wethAssetData, orders, types_1.MarketOperation.Sell, GAS_PRICE, protocolFeeUtils)];
                case 21:
                    marketSellSwapQuote = _c.sent();
                    return [4 /*yield*/, swap_quote_1.getFullyFillableSwapQuoteWithNoFeesAsync(makerAssetData, wethAssetData, orders, types_1.MarketOperation.Buy, GAS_PRICE, protocolFeeUtils)];
                case 22:
                    marketBuySwapQuote = _c.sent();
                    return [4 /*yield*/, swap_quote_1.getFullyFillableSwapQuoteWithNoFeesAsync(makerAssetData, takerAssetData, invalidOrders, types_1.MarketOperation.Buy, GAS_PRICE, protocolFeeUtils)];
                case 23:
                    invalidMarketBuySwapQuote = _c.sent();
                    swapQuoteConsumer = new forwarder_swap_quote_consumer_1.ForwarderSwapQuoteConsumer(web3_wrapper_1.provider, contractAddresses, {
                        chainId: chainId,
                    });
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
    describe('#executeSwapQuoteOrThrowAsync', function () {
        describe('validation', function () {
            it('should throw if swapQuote provided is not a valid forwarder SwapQuote (taker asset is wEth)', function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    expect(swapQuoteConsumer.executeSwapQuoteOrThrowAsync(invalidMarketBuySwapQuote, { takerAddress: takerAddress })).to.be.rejectedWith("Expected quote.orders[0] to have takerAssetData set as " + wethAssetData + ", but is " + takerAssetData);
                    return [2 /*return*/];
                });
            }); });
        });
        // TODO(david) test execution of swap quotes with fee orders
        describe('valid swap quote', function () {
            /*
             * Testing that SwapQuoteConsumer logic correctly performs a execution (doesn't throw or revert)
             * Does not test the validity of the state change performed by the forwarder smart contract
             */
            it('should perform a marketBuy execution when provided a MarketBuy type swapQuote', function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, expectMakerAndTakerBalancesAsync(new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI), constants_1.constants.ZERO_AMOUNT)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketBuySwapQuote, {
                                    takerAddress: takerAddress,
                                    gasLimit: 4000000,
                                    ethAmount: new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                                })];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, expectMakerAndTakerBalancesAsync(constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI))];
                        case 3:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should perform a marketSell execution when provided a MarketSell type swapQuote', function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, expectMakerAndTakerBalancesAsync(new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI), constants_1.constants.ZERO_AMOUNT)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketSellSwapQuote, {
                                    takerAddress: takerAddress,
                                    gasLimit: 4000000,
                                })];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, expectMakerAndTakerBalancesAsync(constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI))];
                        case 3:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should perform a marketBuy execution with affiliate fees', function () { return __awaiter(_this, void 0, void 0, function () {
                var feeRecipientEthBalanceBefore, feeRecipientEthBalanceAfter, totalEthSpent;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, expectMakerAndTakerBalancesAsync(new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI), constants_1.constants.ZERO_AMOUNT)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, web3_wrapper_1.web3Wrapper.getBalanceInWeiAsync(feeRecipient)];
                        case 2:
                            feeRecipientEthBalanceBefore = _a.sent();
                            return [4 /*yield*/, swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketBuySwapQuote, {
                                    takerAddress: takerAddress,
                                    gasLimit: 4000000,
                                    extensionContractOpts: {
                                        feePercentage: 0.05,
                                        feeRecipient: feeRecipient,
                                    },
                                })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, expectMakerAndTakerBalancesAsync(constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI))];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, web3_wrapper_1.web3Wrapper.getBalanceInWeiAsync(feeRecipient)];
                        case 5:
                            feeRecipientEthBalanceAfter = _a.sent();
                            totalEthSpent = marketBuySwapQuote.bestCaseQuoteInfo.totalTakerAssetAmount.plus(marketBuySwapQuote.bestCaseQuoteInfo.protocolFeeInWeiAmount);
                            expect(feeRecipientEthBalanceAfter.minus(feeRecipientEthBalanceBefore)).to.bignumber.equal(new utils_1.BigNumber(FEE_PERCENTAGE).times(totalEthSpent));
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should perform a marketSell execution with affiliate fees', function () { return __awaiter(_this, void 0, void 0, function () {
                var feeRecipientEthBalanceBefore, feeRecipientEthBalanceAfter, totalEthSpent;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, expectMakerAndTakerBalancesAsync(new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI), constants_1.constants.ZERO_AMOUNT)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, web3_wrapper_1.web3Wrapper.getBalanceInWeiAsync(feeRecipient)];
                        case 2:
                            feeRecipientEthBalanceBefore = _a.sent();
                            return [4 /*yield*/, swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketSellSwapQuote, {
                                    takerAddress: takerAddress,
                                    gasLimit: 4000000,
                                    extensionContractOpts: {
                                        feePercentage: 0.05,
                                        feeRecipient: feeRecipient,
                                    },
                                })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, expectMakerAndTakerBalancesAsync(constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI))];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, web3_wrapper_1.web3Wrapper.getBalanceInWeiAsync(feeRecipient)];
                        case 5:
                            feeRecipientEthBalanceAfter = _a.sent();
                            totalEthSpent = marketBuySwapQuote.bestCaseQuoteInfo.totalTakerAssetAmount.plus(marketBuySwapQuote.bestCaseQuoteInfo.protocolFeeInWeiAmount);
                            expect(feeRecipientEthBalanceAfter.minus(feeRecipientEthBalanceBefore)).to.bignumber.equal(new utils_1.BigNumber(FEE_PERCENTAGE).times(totalEthSpent));
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
    describe('#getCalldataOrThrow', function () {
        describe('validation', function () {
            it('should throw if swap quote provided is not a valid forwarder SwapQuote (taker asset is WETH)', function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    expect(swapQuoteConsumer.getCalldataOrThrowAsync(invalidMarketBuySwapQuote, {})).to.be.rejectedWith("Expected quote.orders[0] to have takerAssetData set as " + wethAssetData + ", but is " + takerAssetData);
                    return [2 /*return*/];
                });
            }); });
        });
        describe('valid swap quote', function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                it('provide correct and optimized calldata options with default options for a marketSell SwapQuote (no affiliate fees)', function () { return __awaiter(_this, void 0, void 0, function () {
                    var _a, calldataHexString, toAddress, ethAmount;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, expectMakerAndTakerBalancesAsync(new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI), constants_1.constants.ZERO_AMOUNT)];
                            case 1:
                                _b.sent();
                                return [4 /*yield*/, swapQuoteConsumer.getCalldataOrThrowAsync(marketSellSwapQuote, {})];
                            case 2:
                                _a = _b.sent(), calldataHexString = _a.calldataHexString, toAddress = _a.toAddress, ethAmount = _a.ethAmount;
                                expect(toAddress).to.deep.equal(forwarderContract.address);
                                return [4 /*yield*/, web3_wrapper_1.web3Wrapper.sendTransactionAsync({
                                        from: takerAddress,
                                        to: toAddress,
                                        data: calldataHexString,
                                        value: ethAmount,
                                        gasPrice: GAS_PRICE,
                                        gas: 4000000,
                                    })];
                            case 3:
                                _b.sent();
                                return [4 /*yield*/, expectMakerAndTakerBalancesAsync(constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI))];
                            case 4:
                                _b.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('provide correct and optimized calldata options with default options for a marketBuy SwapQuote (no affiliate fees)', function () { return __awaiter(_this, void 0, void 0, function () {
                    var _a, calldataHexString, toAddress, ethAmount;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, expectMakerAndTakerBalancesAsync(new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI), constants_1.constants.ZERO_AMOUNT)];
                            case 1:
                                _b.sent();
                                return [4 /*yield*/, swapQuoteConsumer.getCalldataOrThrowAsync(marketBuySwapQuote, {})];
                            case 2:
                                _a = _b.sent(), calldataHexString = _a.calldataHexString, toAddress = _a.toAddress, ethAmount = _a.ethAmount;
                                expect(toAddress).to.deep.equal(contractAddresses.forwarder);
                                return [4 /*yield*/, web3_wrapper_1.web3Wrapper.sendTransactionAsync({
                                        from: takerAddress,
                                        to: toAddress,
                                        data: calldataHexString,
                                        value: ethAmount,
                                        gasPrice: GAS_PRICE,
                                        gas: 4000000,
                                    })];
                            case 3:
                                _b.sent();
                                return [4 /*yield*/, expectMakerAndTakerBalancesAsync(constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI))];
                            case 4:
                                _b.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('provide correct and optimized calldata options with affiliate fees for a marketSell SwapQuote', function () { return __awaiter(_this, void 0, void 0, function () {
                    var feeRecipientEthBalanceBefore, _a, calldataHexString, toAddress, ethAmount, totalEthSpent, feeRecipientEthBalanceAfter;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, expectMakerAndTakerBalancesAsync(new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI), constants_1.constants.ZERO_AMOUNT)];
                            case 1:
                                _b.sent();
                                return [4 /*yield*/, web3_wrapper_1.web3Wrapper.getBalanceInWeiAsync(feeRecipient)];
                            case 2:
                                feeRecipientEthBalanceBefore = _b.sent();
                                return [4 /*yield*/, swapQuoteConsumer.getCalldataOrThrowAsync(marketSellSwapQuote, {
                                        extensionContractOpts: {
                                            feePercentage: 0.05,
                                            feeRecipient: feeRecipient,
                                        },
                                    })];
                            case 3:
                                _a = _b.sent(), calldataHexString = _a.calldataHexString, toAddress = _a.toAddress, ethAmount = _a.ethAmount;
                                expect(toAddress).to.deep.equal(contractAddresses.forwarder);
                                return [4 /*yield*/, web3_wrapper_1.web3Wrapper.sendTransactionAsync({
                                        from: takerAddress,
                                        to: toAddress,
                                        data: calldataHexString,
                                        value: ethAmount,
                                        gasPrice: GAS_PRICE,
                                        gas: 4000000,
                                    })];
                            case 4:
                                _b.sent();
                                return [4 /*yield*/, expectMakerAndTakerBalancesAsync(constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI))];
                            case 5:
                                _b.sent();
                                totalEthSpent = marketBuySwapQuote.bestCaseQuoteInfo.totalTakerAssetAmount.plus(marketBuySwapQuote.bestCaseQuoteInfo.protocolFeeInWeiAmount);
                                return [4 /*yield*/, web3_wrapper_1.web3Wrapper.getBalanceInWeiAsync(feeRecipient)];
                            case 6:
                                feeRecipientEthBalanceAfter = _b.sent();
                                expect(feeRecipientEthBalanceAfter.minus(feeRecipientEthBalanceBefore)).to.bignumber.equal(new utils_1.BigNumber(FEE_PERCENTAGE).times(totalEthSpent));
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('provide correct and optimized calldata options with affiliate fees for a marketBuy SwapQuote', function () { return __awaiter(_this, void 0, void 0, function () {
                    var feeRecipientEthBalanceBefore, _a, calldataHexString, toAddress, ethAmount, totalEthSpent, feeRecipientEthBalanceAfter;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, expectMakerAndTakerBalancesAsync(new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI), constants_1.constants.ZERO_AMOUNT)];
                            case 1:
                                _b.sent();
                                return [4 /*yield*/, web3_wrapper_1.web3Wrapper.getBalanceInWeiAsync(feeRecipient)];
                            case 2:
                                feeRecipientEthBalanceBefore = _b.sent();
                                return [4 /*yield*/, swapQuoteConsumer.getCalldataOrThrowAsync(marketBuySwapQuote, {
                                        extensionContractOpts: {
                                            feePercentage: 0.05,
                                            feeRecipient: feeRecipient,
                                        },
                                    })];
                            case 3:
                                _a = _b.sent(), calldataHexString = _a.calldataHexString, toAddress = _a.toAddress, ethAmount = _a.ethAmount;
                                expect(toAddress).to.deep.equal(contractAddresses.forwarder);
                                return [4 /*yield*/, web3_wrapper_1.web3Wrapper.sendTransactionAsync({
                                        from: takerAddress,
                                        to: toAddress,
                                        data: calldataHexString,
                                        value: ethAmount,
                                        gasPrice: GAS_PRICE,
                                        gas: 4000000,
                                    })];
                            case 4:
                                _b.sent();
                                return [4 /*yield*/, expectMakerAndTakerBalancesAsync(constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI))];
                            case 5:
                                _b.sent();
                                totalEthSpent = marketBuySwapQuote.bestCaseQuoteInfo.totalTakerAssetAmount.plus(marketBuySwapQuote.bestCaseQuoteInfo.protocolFeeInWeiAmount);
                                return [4 /*yield*/, web3_wrapper_1.web3Wrapper.getBalanceInWeiAsync(feeRecipient)];
                            case 6:
                                feeRecipientEthBalanceAfter = _b.sent();
                                expect(feeRecipientEthBalanceAfter.minus(feeRecipientEthBalanceBefore)).to.bignumber.equal(new utils_1.BigNumber(FEE_PERCENTAGE).times(totalEthSpent));
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        }); });
    });
    // tslint:disable-next-line: max-file-line-count
});
//# sourceMappingURL=forwarder_swap_quote_consumer_test.js.map