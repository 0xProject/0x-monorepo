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
var exchange_swap_quote_consumer_1 = require("../src/quote_consumers/exchange_swap_quote_consumer");
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
var UNLIMITED_ALLOWANCE = new utils_1.BigNumber(2).pow(256).minus(1); // tslint:disable-line:custom-no-magic-numbers
var PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS = [
    {
        takerAssetAmount: new utils_1.BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new utils_1.BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new utils_1.BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new utils_1.BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
    },
    {
        takerAssetAmount: new utils_1.BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new utils_1.BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new utils_1.BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new utils_1.BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
    },
    {
        takerAssetAmount: new utils_1.BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new utils_1.BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new utils_1.BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
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
describe('ExchangeSwapQuoteConsumer', function () {
    var protocolFeeUtils;
    var userAddresses;
    var erc20MakerTokenContract;
    var erc20TakerTokenContract;
    var coinbaseAddress;
    var makerAddress;
    var takerAddress;
    var orderFactory;
    var feeRecipient;
    var makerTokenAddress;
    var takerTokenAddress;
    var makerAssetData;
    var takerAssetData;
    var wethAssetData;
    var contractAddresses;
    var exchangeContract;
    var chainId = TESTRPC_CHAIN_ID;
    var orders;
    var marketSellSwapQuote;
    var marketBuySwapQuote;
    var swapQuoteConsumer;
    var expectMakerAndTakerBalancesForMakerAssetAsync;
    var expectMakerAndTakerBalancesForTakerAssetAsync;
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
                    _c = __read([
                        order_utils_1.assetDataUtils.encodeERC20AssetData(makerTokenAddress),
                        order_utils_1.assetDataUtils.encodeERC20AssetData(takerTokenAddress),
                        order_utils_1.assetDataUtils.encodeERC20AssetData(contractAddresses.etherToken),
                    ], 3), makerAssetData = _c[0], takerAssetData = _c[1], wethAssetData = _c[2];
                    erc20MakerTokenContract = new contract_wrappers_1.ERC20TokenContract(makerTokenAddress, web3_wrapper_1.provider);
                    erc20TakerTokenContract = new contract_wrappers_1.ERC20TokenContract(takerTokenAddress, web3_wrapper_1.provider);
                    exchangeContract = new contract_wrappers_1.ExchangeContract(contractAddresses.exchange, web3_wrapper_1.provider);
                    defaultOrderParams = __assign({}, contracts_test_utils_1.constants.STATIC_ORDER_PARAMS, { makerAddress: makerAddress,
                        takerAddress: takerAddress,
                        makerAssetData: makerAssetData,
                        takerAssetData: takerAssetData, makerFeeAssetData: constants_1.constants.NULL_ERC20_ASSET_DATA, takerFeeAssetData: constants_1.constants.NULL_ERC20_ASSET_DATA, makerFee: constants_1.constants.ZERO_AMOUNT, takerFee: constants_1.constants.ZERO_AMOUNT, feeRecipientAddress: feeRecipient, exchangeAddress: contractAddresses.exchange, chainId: chainId });
                    privateKey = contracts_test_utils_1.constants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(makerAddress)];
                    orderFactory = new contracts_test_utils_1.OrderFactory(privateKey, defaultOrderParams);
                    protocolFeeUtils = new protocol_fee_utils_1.ProtocolFeeUtils(constants_1.constants.PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS, new utils_1.BigNumber(1));
                    expectMakerAndTakerBalancesForTakerAssetAsync = expectMakerAndTakerBalancesAsyncFactory(erc20TakerTokenContract, makerAddress, takerAddress);
                    expectMakerAndTakerBalancesForMakerAssetAsync = expectMakerAndTakerBalancesAsyncFactory(erc20MakerTokenContract, makerAddress, takerAddress);
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
        var e_1, _a, PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1, PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1_1, partialOrder, order, prunedOrder, e_1_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, blockchainLifecycle.startAsync()];
                case 1:
                    _b.sent();
                    orders = [];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 7, 8, 9]);
                    PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1 = __values(PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS), PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1_1 = PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1.next();
                    _b.label = 3;
                case 3:
                    if (!!PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1_1.done) return [3 /*break*/, 6];
                    partialOrder = PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1_1.value;
                    return [4 /*yield*/, orderFactory.newSignedOrderAsync(partialOrder)];
                case 4:
                    order = _b.sent();
                    prunedOrder = __assign({}, order, partialOrder);
                    orders.push(prunedOrder);
                    _b.label = 5;
                case 5:
                    PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1_1 = PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1.next();
                    return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 9];
                case 7:
                    e_1_1 = _b.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 9];
                case 8:
                    try {
                        if (PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1_1 && !PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1_1.done && (_a = PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1.return)) _a.call(PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7 /*endfinally*/];
                case 9: return [4 /*yield*/, swap_quote_1.getFullyFillableSwapQuoteWithNoFeesAsync(makerAssetData, takerAssetData, orders, types_1.MarketOperation.Sell, GAS_PRICE, protocolFeeUtils)];
                case 10:
                    marketSellSwapQuote = _b.sent();
                    return [4 /*yield*/, swap_quote_1.getFullyFillableSwapQuoteWithNoFeesAsync(makerAssetData, takerAssetData, orders, types_1.MarketOperation.Buy, GAS_PRICE, protocolFeeUtils)];
                case 11:
                    marketBuySwapQuote = _b.sent();
                    swapQuoteConsumer = new exchange_swap_quote_consumer_1.ExchangeSwapQuoteConsumer(web3_wrapper_1.provider, contractAddresses, {
                        chainId: chainId,
                    });
                    return [4 /*yield*/, erc20MakerTokenContract
                            .transfer(makerAddress, marketBuySwapQuote.worstCaseQuoteInfo.makerAssetAmount)
                            .sendTransactionAsync({
                            from: coinbaseAddress,
                        })];
                case 12:
                    _b.sent();
                    return [4 /*yield*/, erc20TakerTokenContract
                            .transfer(takerAddress, marketBuySwapQuote.worstCaseQuoteInfo.totalTakerAssetAmount)
                            .sendTransactionAsync({
                            from: coinbaseAddress,
                        })];
                case 13:
                    _b.sent();
                    return [4 /*yield*/, erc20MakerTokenContract
                            .approve(contractAddresses.erc20Proxy, UNLIMITED_ALLOWANCE)
                            .sendTransactionAsync({ from: makerAddress })];
                case 14:
                    _b.sent();
                    return [4 /*yield*/, erc20TakerTokenContract
                            .approve(contractAddresses.erc20Proxy, UNLIMITED_ALLOWANCE)
                            .sendTransactionAsync({ from: takerAddress })];
                case 15:
                    _b.sent();
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
        /*
         * Testing that SwapQuoteConsumer logic correctly performs a execution (doesn't throw or revert)
         * Does not test the validity of the state change performed by the forwarder smart contract
         */
        it('should perform a marketSell execution when provided a MarketSell type swapQuote', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectMakerAndTakerBalancesForMakerAssetAsync(new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI), constants_1.constants.ZERO_AMOUNT)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, expectMakerAndTakerBalancesForTakerAssetAsync(constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI))];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketSellSwapQuote, {
                                takerAddress: takerAddress,
                                gasLimit: 4000000,
                            })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, expectMakerAndTakerBalancesForMakerAssetAsync(constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI))];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, expectMakerAndTakerBalancesForTakerAssetAsync(new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI), constants_1.constants.ZERO_AMOUNT)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should perform a marketBuy execution when provided a MarketBuy type swapQuote', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectMakerAndTakerBalancesForMakerAssetAsync(new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI), constants_1.constants.ZERO_AMOUNT)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, expectMakerAndTakerBalancesForTakerAssetAsync(constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI))];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketBuySwapQuote, {
                                takerAddress: takerAddress,
                                gasLimit: 4000000,
                            })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, expectMakerAndTakerBalancesForMakerAssetAsync(constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI))];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, expectMakerAndTakerBalancesForTakerAssetAsync(new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI), constants_1.constants.ZERO_AMOUNT)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#getCalldataOrThrow', function () {
        describe('valid swap quote', function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                it('provide correct and optimized calldata options with default options for a marketSell SwapQuote (no affiliate fees)', function () { return __awaiter(_this, void 0, void 0, function () {
                    var _a, calldataHexString, toAddress, ethAmount;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, expectMakerAndTakerBalancesForMakerAssetAsync(new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI), constants_1.constants.ZERO_AMOUNT)];
                            case 1:
                                _b.sent();
                                return [4 /*yield*/, swapQuoteConsumer.getCalldataOrThrowAsync(marketSellSwapQuote, {})];
                            case 2:
                                _a = _b.sent(), calldataHexString = _a.calldataHexString, toAddress = _a.toAddress, ethAmount = _a.ethAmount;
                                expect(toAddress).to.deep.equal(exchangeContract.address);
                                return [4 /*yield*/, web3_wrapper_1.web3Wrapper.sendTransactionAsync({
                                        from: takerAddress,
                                        to: toAddress,
                                        data: calldataHexString,
                                        gas: 4000000,
                                        gasPrice: GAS_PRICE,
                                        value: ethAmount,
                                    })];
                            case 3:
                                _b.sent();
                                return [4 /*yield*/, expectMakerAndTakerBalancesForMakerAssetAsync(constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI))];
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
                            case 0: return [4 /*yield*/, expectMakerAndTakerBalancesForMakerAssetAsync(new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI), constants_1.constants.ZERO_AMOUNT)];
                            case 1:
                                _b.sent();
                                return [4 /*yield*/, swapQuoteConsumer.getCalldataOrThrowAsync(marketBuySwapQuote, {})];
                            case 2:
                                _a = _b.sent(), calldataHexString = _a.calldataHexString, toAddress = _a.toAddress, ethAmount = _a.ethAmount;
                                expect(toAddress).to.deep.equal(exchangeContract.address);
                                return [4 /*yield*/, web3_wrapper_1.web3Wrapper.sendTransactionAsync({
                                        from: takerAddress,
                                        to: toAddress,
                                        data: calldataHexString,
                                        gas: 4000000,
                                        gasPrice: GAS_PRICE,
                                        value: ethAmount,
                                    })];
                            case 3:
                                _b.sent();
                                return [4 /*yield*/, expectMakerAndTakerBalancesForMakerAssetAsync(constants_1.constants.ZERO_AMOUNT, new utils_1.BigNumber(10).multipliedBy(ONE_ETH_IN_WEI))];
                            case 4:
                                _b.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        }); });
    });
});
//# sourceMappingURL=exchange_swap_quote_consumer_test.js.map