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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var contracts_test_utils_1 = require("@0x/contracts-test-utils");
var order_utils_1 = require("@0x/order-utils");
var utils_1 = require("@0x/utils");
var _ = require("lodash");
var transformer_data_encoders_1 = require("../../src/transformer_data_encoders");
var artifacts_1 = require("../artifacts");
var wrappers_1 = require("../wrappers");
var NULL_ADDRESS = contracts_test_utils_1.constants.NULL_ADDRESS, NULL_BYTES = contracts_test_utils_1.constants.NULL_BYTES, MAX_UINT256 = contracts_test_utils_1.constants.MAX_UINT256, ZERO_AMOUNT = contracts_test_utils_1.constants.ZERO_AMOUNT;
contracts_test_utils_1.blockchainTests.resets('FillQuoteTransformer', function (env) {
    var maker;
    var feeRecipient;
    var exchange;
    var transformer;
    var host;
    var makerToken;
    var takerToken;
    var takerFeeToken;
    var singleProtocolFee;
    var GAS_PRICE = 1337;
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b;
        var _this = this;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, env.getAccountAddressesAsync()];
                case 1:
                    _a = __read.apply(void 0, [_c.sent(), 2]), maker = _a[0], feeRecipient = _a[1];
                    return [4 /*yield*/, wrappers_1.TestFillQuoteTransformerExchangeContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestFillQuoteTransformerExchange, env.provider, env.txDefaults, artifacts_1.artifacts)];
                case 2:
                    exchange = _c.sent();
                    return [4 /*yield*/, wrappers_1.FillQuoteTransformerContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.FillQuoteTransformer, env.provider, env.txDefaults, artifacts_1.artifacts, exchange.address)];
                case 3:
                    transformer = _c.sent();
                    return [4 /*yield*/, wrappers_1.TestFillQuoteTransformerHostContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestFillQuoteTransformerHost, env.provider, __assign({}, env.txDefaults, { gasPrice: GAS_PRICE }), artifacts_1.artifacts)];
                case 4:
                    host = _c.sent();
                    return [4 /*yield*/, Promise.all(_.times(3, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, wrappers_1.TestMintableERC20TokenContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestMintableERC20Token, env.provider, env.txDefaults, artifacts_1.artifacts)];
                            });
                        }); }))];
                case 5:
                    _b = __read.apply(void 0, [_c.sent(), 3]), makerToken = _b[0], takerToken = _b[1], takerFeeToken = _b[2];
                    return [4 /*yield*/, exchange.protocolFeeMultiplier().callAsync()];
                case 6:
                    singleProtocolFee = (_c.sent()).times(GAS_PRICE);
                    return [2 /*return*/];
            }
        });
    }); });
    function createOrder(fields) {
        if (fields === void 0) { fields = {}; }
        return __assign({ chainId: 1, exchangeAddress: exchange.address, expirationTimeSeconds: ZERO_AMOUNT, salt: ZERO_AMOUNT, senderAddress: NULL_ADDRESS, takerAddress: NULL_ADDRESS, makerAddress: maker, feeRecipientAddress: feeRecipient, makerAssetAmount: contracts_test_utils_1.getRandomInteger('0.1e18', '1e18'), takerAssetAmount: contracts_test_utils_1.getRandomInteger('0.1e18', '1e18'), makerFee: ZERO_AMOUNT, takerFee: contracts_test_utils_1.getRandomInteger('0.001e18', '0.1e18'), makerAssetData: order_utils_1.assetDataUtils.encodeERC20AssetData(makerToken.address), takerAssetData: order_utils_1.assetDataUtils.encodeERC20AssetData(takerToken.address), makerFeeAssetData: NULL_BYTES, takerFeeAssetData: order_utils_1.assetDataUtils.encodeERC20AssetData(takerToken.address), filledTakerAssetAmount: ZERO_AMOUNT }, fields);
    }
    var ZERO_QUOTE_FILL_RESULTS = {
        makerAssetBought: ZERO_AMOUNT,
        takerAssetSpent: ZERO_AMOUNT,
        protocolFeePaid: ZERO_AMOUNT,
    };
    function getExpectedSellQuoteFillResults(orders, takerAssetFillAmount) {
        if (takerAssetFillAmount === void 0) { takerAssetFillAmount = contracts_test_utils_1.constants.MAX_UINT256; }
        var e_1, _a;
        var qfr = __assign({}, ZERO_QUOTE_FILL_RESULTS);
        try {
            for (var orders_1 = __values(orders), orders_1_1 = orders_1.next(); !orders_1_1.done; orders_1_1 = orders_1.next()) {
                var order = orders_1_1.value;
                if (qfr.takerAssetSpent.gte(takerAssetFillAmount)) {
                    break;
                }
                var singleFillAmount = utils_1.BigNumber.min(takerAssetFillAmount.minus(qfr.takerAssetSpent), order.takerAssetAmount.minus(order.filledTakerAssetAmount));
                var fillRatio = singleFillAmount.div(order.takerAssetAmount);
                qfr.takerAssetSpent = qfr.takerAssetSpent.plus(singleFillAmount);
                qfr.protocolFeePaid = qfr.protocolFeePaid.plus(singleProtocolFee);
                qfr.makerAssetBought = qfr.makerAssetBought.plus(fillRatio.times(order.makerAssetAmount).integerValue(utils_1.BigNumber.ROUND_DOWN));
                var takerFee = fillRatio.times(order.takerFee).integerValue(utils_1.BigNumber.ROUND_DOWN);
                if (order.takerAssetData === order.takerFeeAssetData) {
                    // Taker fee is in taker asset.
                    qfr.takerAssetSpent = qfr.takerAssetSpent.plus(takerFee);
                }
                else if (order.makerAssetData === order.takerFeeAssetData) {
                    // Taker fee is in maker asset.
                    qfr.makerAssetBought = qfr.makerAssetBought.minus(takerFee);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (orders_1_1 && !orders_1_1.done && (_a = orders_1.return)) _a.call(orders_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return qfr;
    }
    function getExpectedBuyQuoteFillResults(orders, makerAssetFillAmount) {
        if (makerAssetFillAmount === void 0) { makerAssetFillAmount = contracts_test_utils_1.constants.MAX_UINT256; }
        var e_2, _a;
        var qfr = __assign({}, ZERO_QUOTE_FILL_RESULTS);
        try {
            for (var orders_2 = __values(orders), orders_2_1 = orders_2.next(); !orders_2_1.done; orders_2_1 = orders_2.next()) {
                var order = orders_2_1.value;
                if (qfr.makerAssetBought.gte(makerAssetFillAmount)) {
                    break;
                }
                var filledMakerAssetAmount = order.filledTakerAssetAmount
                    .times(order.makerAssetAmount.div(order.takerAssetAmount))
                    .integerValue(utils_1.BigNumber.ROUND_DOWN);
                var singleFillAmount = utils_1.BigNumber.min(makerAssetFillAmount.minus(qfr.makerAssetBought), order.makerAssetAmount.minus(filledMakerAssetAmount));
                var fillRatio = singleFillAmount.div(order.makerAssetAmount);
                qfr.takerAssetSpent = qfr.takerAssetSpent.plus(fillRatio.times(order.takerAssetAmount).integerValue(utils_1.BigNumber.ROUND_UP));
                qfr.protocolFeePaid = qfr.protocolFeePaid.plus(singleProtocolFee);
                qfr.makerAssetBought = qfr.makerAssetBought.plus(singleFillAmount);
                var takerFee = fillRatio.times(order.takerFee).integerValue(utils_1.BigNumber.ROUND_UP);
                if (order.takerAssetData === order.takerFeeAssetData) {
                    // Taker fee is in taker asset.
                    qfr.takerAssetSpent = qfr.takerAssetSpent.plus(takerFee);
                }
                else if (order.makerAssetData === order.takerFeeAssetData) {
                    // Taker fee is in maker asset.
                    qfr.makerAssetBought = qfr.makerAssetBought.minus(takerFee);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (orders_2_1 && !orders_2_1.done && (_a = orders_2.return)) _a.call(orders_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return qfr;
    }
    var ZERO_BALANCES = {
        makerAssetBalance: ZERO_AMOUNT,
        takerAssetBalance: ZERO_AMOUNT,
        takerFeeBalance: ZERO_AMOUNT,
        protocolFeeBalance: ZERO_AMOUNT,
    };
    function getBalancesAsync(owner) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, balances;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        balances = __assign({}, ZERO_BALANCES);
                        return [4 /*yield*/, Promise.all([
                                makerToken.balanceOf(owner).callAsync(),
                                takerToken.balanceOf(owner).callAsync(),
                                takerFeeToken.balanceOf(owner).callAsync(),
                                env.web3Wrapper.getBalanceInWeiAsync(owner),
                            ])];
                    case 1:
                        _a = __read.apply(void 0, [_b.sent(), 4]), balances.makerAssetBalance = _a[0], balances.takerAssetBalance = _a[1], balances.takerFeeBalance = _a[2], balances.protocolFeeBalance = _a[3];
                        return [2 /*return*/, balances];
                }
            });
        });
    }
    function assertBalances(actual, expected) {
        contracts_test_utils_1.assertIntegerRoughlyEquals(actual.makerAssetBalance, expected.makerAssetBalance, 10, 'makerAssetBalance');
        contracts_test_utils_1.assertIntegerRoughlyEquals(actual.takerAssetBalance, expected.takerAssetBalance, 10, 'takerAssetBalance');
        contracts_test_utils_1.assertIntegerRoughlyEquals(actual.takerFeeBalance, expected.takerFeeBalance, 10, 'takerFeeBalance');
        contracts_test_utils_1.assertIntegerRoughlyEquals(actual.protocolFeeBalance, expected.protocolFeeBalance, 10, 'protocolFeeBalance');
    }
    function encodeTransformData(fields) {
        if (fields === void 0) { fields = {}; }
        return transformer_data_encoders_1.encodeFillQuoteTransformerData(__assign({ side: transformer_data_encoders_1.FillQuoteTransformerSide.Sell, sellToken: takerToken.address, buyToken: makerToken.address, orders: [], signatures: [], maxOrderFillAmounts: [], fillAmount: MAX_UINT256 }, fields));
    }
    function encodeExchangeBehavior(filledTakerAssetAmount, makerAssetMintRatio) {
        if (filledTakerAssetAmount === void 0) { filledTakerAssetAmount = 0; }
        if (makerAssetMintRatio === void 0) { makerAssetMintRatio = 1.0; }
        return utils_1.hexUtils.slice(exchange
            .encodeBehaviorData({
            filledTakerAssetAmount: new utils_1.BigNumber(filledTakerAssetAmount),
            makerAssetMintRatio: new utils_1.BigNumber(makerAssetMintRatio).times('1e18').integerValue(),
        })
            .getABIEncodedTransactionData(), 4);
    }
    var ERC20_ASSET_PROXY_ID = '0xf47261b0';
    describe('sell quotes', function () {
        it('can fully sell to a single order quote', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, qfr, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orders = _.times(1, function () { return createOrder(); });
                        signatures = orders.map(function () { return encodeExchangeBehavior(); });
                        qfr = getExpectedSellQuoteFillResults(orders);
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                            }))
                                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought })]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can fully sell to multi order quote', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, qfr, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orders = _.times(3, function () { return createOrder(); });
                        signatures = orders.map(function () { return encodeExchangeBehavior(); });
                        qfr = getExpectedSellQuoteFillResults(orders);
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                            }))
                                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought })]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can partially sell to single order quote', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, qfr, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orders = _.times(1, function () { return createOrder(); });
                        signatures = orders.map(function () { return encodeExchangeBehavior(); });
                        qfr = getExpectedSellQuoteFillResults(orders, getExpectedSellQuoteFillResults(orders).takerAssetSpent.dividedToIntegerBy(2));
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                            }))
                                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought })]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can partially sell to multi order quote and refund unused protocol fees', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, qfr, maxProtocolFees, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orders = _.times(3, function () { return createOrder(); });
                        signatures = orders.map(function () { return encodeExchangeBehavior(); });
                        qfr = getExpectedSellQuoteFillResults(orders.slice(0, 2));
                        maxProtocolFees = singleProtocolFee.times(orders.length);
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                            }))
                                .awaitTransactionSuccessAsync({ value: maxProtocolFees })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought, protocolFeeBalance: singleProtocolFee })]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can sell to multi order quote with a failing order', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, validOrders, signatures, qfr, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orders = _.times(3, function () { return createOrder(); });
                        validOrders = orders.slice(1);
                        signatures = __spread([NULL_BYTES], validOrders.map(function () { return encodeExchangeBehavior(); }));
                        qfr = getExpectedSellQuoteFillResults(validOrders);
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                            }))
                                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought })]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('succeeds if an order transfers too few maker tokens', function () { return __awaiter(_this, void 0, void 0, function () {
            var mintScale, orders, signatures, qfr, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        mintScale = 0.5;
                        orders = _.times(3, function () { return createOrder(); });
                        signatures = __spread([
                            encodeExchangeBehavior(0, mintScale)
                        ], orders.slice(1).map(function () { return encodeExchangeBehavior(); }));
                        qfr = getExpectedSellQuoteFillResults(orders);
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                            }))
                                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought
                                    .minus(orders[0].makerAssetAmount.times(1 - mintScale))
                                    .integerValue(utils_1.BigNumber.ROUND_DOWN) })]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can fail if an order is partially filled', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, filledOrder, signatures, qfr, tx;
            return __generator(this, function (_a) {
                orders = _.times(3, function () { return createOrder(); });
                filledOrder = __assign({}, orders[0], { filledTakerAssetAmount: orders[0].takerAssetAmount.dividedToIntegerBy(2) });
                signatures = __spread([
                    encodeExchangeBehavior(filledOrder.filledTakerAssetAmount)
                ], orders.slice(1).map(function () { return encodeExchangeBehavior(); }));
                qfr = getExpectedSellQuoteFillResults(orders);
                tx = host
                    .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                    orders: orders,
                    signatures: signatures,
                }))
                    .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.IncompleteFillSellQuoteError(takerToken.address, getExpectedSellQuoteFillResults(__spread([filledOrder], orders.slice(1))).takerAssetSpent, qfr.takerAssetSpent))];
            });
        }); });
        it('fails if not enough protocol fee provided', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, qfr, tx;
            return __generator(this, function (_a) {
                orders = _.times(3, function () { return createOrder(); });
                signatures = orders.map(function () { return encodeExchangeBehavior(); });
                qfr = getExpectedSellQuoteFillResults(orders);
                tx = host
                    .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                    orders: orders,
                    signatures: signatures,
                }))
                    .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid.minus(1) });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.InsufficientProtocolFeeError(singleProtocolFee.minus(1), singleProtocolFee))];
            });
        }); });
        it('can sell less than the taker token balance', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, qfr, takerTokenBalance, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orders = _.times(3, function () { return createOrder(); });
                        signatures = orders.map(function () { return encodeExchangeBehavior(); });
                        qfr = getExpectedSellQuoteFillResults(orders);
                        takerTokenBalance = qfr.takerAssetSpent.times(1.01).integerValue();
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, takerTokenBalance, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                                fillAmount: qfr.takerAssetSpent,
                            }))
                                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought, takerAssetBalance: qfr.takerAssetSpent.times(0.01).integerValue() })]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('fails to sell more than the taker token balance', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, qfr, takerTokenBalance, tx;
            return __generator(this, function (_a) {
                orders = _.times(3, function () { return createOrder(); });
                signatures = orders.map(function () { return encodeExchangeBehavior(); });
                qfr = getExpectedSellQuoteFillResults(orders);
                takerTokenBalance = qfr.takerAssetSpent.times(0.99).integerValue();
                tx = host
                    .executeTransform(transformer.address, takerToken.address, takerTokenBalance, encodeTransformData({
                    orders: orders,
                    signatures: signatures,
                    fillAmount: qfr.takerAssetSpent,
                }))
                    .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.IncompleteFillSellQuoteError(takerToken.address, getExpectedSellQuoteFillResults(orders.slice(0, 2)).takerAssetSpent, qfr.takerAssetSpent))];
            });
        }); });
        it('can fully sell to a single order with maker asset taker fees', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, qfr, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orders = _.times(1, function () {
                            return createOrder({
                                takerFeeAssetData: order_utils_1.assetDataUtils.encodeERC20AssetData(makerToken.address),
                            });
                        });
                        signatures = orders.map(function () { return encodeExchangeBehavior(); });
                        qfr = getExpectedSellQuoteFillResults(orders);
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                            }))
                                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought })]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('fails if an order has a non-standard taker fee asset', function () { return __awaiter(_this, void 0, void 0, function () {
            var BAD_ASSET_DATA, orders, signatures, qfr, tx;
            return __generator(this, function (_a) {
                BAD_ASSET_DATA = utils_1.hexUtils.random(36);
                orders = _.times(1, function () { return createOrder({ takerFeeAssetData: BAD_ASSET_DATA }); });
                signatures = orders.map(function () { return encodeExchangeBehavior(); });
                qfr = getExpectedSellQuoteFillResults(orders);
                tx = host
                    .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                    orders: orders,
                    signatures: signatures,
                }))
                    .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.InvalidERC20AssetDataError(BAD_ASSET_DATA))];
            });
        }); });
        it('fails if an order has a fee asset that is neither maker or taker asset', function () { return __awaiter(_this, void 0, void 0, function () {
            var badToken, BAD_ASSET_DATA, orders, signatures, qfr, tx;
            return __generator(this, function (_a) {
                badToken = contracts_test_utils_1.randomAddress();
                BAD_ASSET_DATA = utils_1.hexUtils.concat(ERC20_ASSET_PROXY_ID, utils_1.hexUtils.leftPad(badToken));
                orders = _.times(1, function () { return createOrder({ takerFeeAssetData: BAD_ASSET_DATA }); });
                signatures = orders.map(function () { return encodeExchangeBehavior(); });
                qfr = getExpectedSellQuoteFillResults(orders);
                tx = host
                    .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                    orders: orders,
                    signatures: signatures,
                }))
                    .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.InvalidTakerFeeTokenError(badToken))];
            });
        }); });
        it('respects `maxOrderFillAmounts`', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, qfr, protocolFee, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orders = _.times(2, function () { return createOrder(); });
                        signatures = orders.map(function () { return encodeExchangeBehavior(); });
                        qfr = getExpectedSellQuoteFillResults(orders.slice(1));
                        protocolFee = singleProtocolFee.times(2);
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                                // Skip the first order.
                                maxOrderFillAmounts: [ZERO_AMOUNT],
                            }))
                                .awaitTransactionSuccessAsync({ value: protocolFee })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought })]);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('buy quotes', function () {
        it('can fully buy from a single order quote', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, qfr, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orders = _.times(1, function () { return createOrder(); });
                        signatures = orders.map(function () { return encodeExchangeBehavior(); });
                        qfr = getExpectedBuyQuoteFillResults(orders);
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                                side: transformer_data_encoders_1.FillQuoteTransformerSide.Buy,
                                fillAmount: qfr.makerAssetBought,
                            }))
                                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought })]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can fully buy from a multi order quote', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, qfr, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orders = _.times(3, function () { return createOrder(); });
                        signatures = orders.map(function () { return encodeExchangeBehavior(); });
                        qfr = getExpectedBuyQuoteFillResults(orders);
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                                side: transformer_data_encoders_1.FillQuoteTransformerSide.Buy,
                                fillAmount: qfr.makerAssetBought,
                            }))
                                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought })]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can partially buy from a single order quote', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, qfr, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orders = _.times(1, function () { return createOrder(); });
                        signatures = orders.map(function () { return encodeExchangeBehavior(); });
                        qfr = getExpectedBuyQuoteFillResults(orders, getExpectedBuyQuoteFillResults(orders).makerAssetBought.dividedToIntegerBy(2));
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                                side: transformer_data_encoders_1.FillQuoteTransformerSide.Buy,
                                fillAmount: qfr.makerAssetBought,
                            }))
                                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought })]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can partially buy from multi order quote and refund unused protocol fees', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, qfr, maxProtocolFees, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orders = _.times(3, function () { return createOrder(); });
                        signatures = orders.map(function () { return encodeExchangeBehavior(); });
                        qfr = getExpectedBuyQuoteFillResults(orders.slice(0, 2));
                        maxProtocolFees = singleProtocolFee.times(orders.length);
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                                side: transformer_data_encoders_1.FillQuoteTransformerSide.Buy,
                                fillAmount: qfr.makerAssetBought,
                            }))
                                .awaitTransactionSuccessAsync({ value: maxProtocolFees })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought, protocolFeeBalance: singleProtocolFee })]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can buy from multi order quote with a failing order', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, validOrders, signatures, qfr, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orders = _.times(3, function () { return createOrder(); });
                        validOrders = orders.slice(1);
                        signatures = __spread([NULL_BYTES], validOrders.map(function () { return encodeExchangeBehavior(); }));
                        qfr = getExpectedBuyQuoteFillResults(validOrders);
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                                side: transformer_data_encoders_1.FillQuoteTransformerSide.Buy,
                                fillAmount: qfr.makerAssetBought,
                            }))
                                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought })]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('succeeds if an order transfers too many maker tokens', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, mintScale, signatures, qfr, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orders = _.times(2, function () { return createOrder(); });
                        mintScale = orders[1].makerAssetAmount.div(orders[0].makerAssetAmount.minus(1)).plus(1);
                        signatures = __spread([
                            encodeExchangeBehavior(0, mintScale)
                        ], orders.slice(1).map(function () { return encodeExchangeBehavior(); }));
                        qfr = getExpectedBuyQuoteFillResults(orders);
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                                side: transformer_data_encoders_1.FillQuoteTransformerSide.Buy,
                                fillAmount: qfr.makerAssetBought,
                            }))
                                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: orders[0].makerAssetAmount.times(mintScale).integerValue(utils_1.BigNumber.ROUND_DOWN), takerAssetBalance: orders[1].takerAssetAmount.plus(orders[1].takerFee), protocolFeeBalance: singleProtocolFee })]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('fails to buy more than available in orders', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, qfr, tx;
            return __generator(this, function (_a) {
                orders = _.times(3, function () { return createOrder(); });
                signatures = orders.map(function () { return encodeExchangeBehavior(); });
                qfr = getExpectedBuyQuoteFillResults(orders);
                tx = host
                    .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                    orders: orders,
                    signatures: signatures,
                    side: transformer_data_encoders_1.FillQuoteTransformerSide.Buy,
                    fillAmount: qfr.makerAssetBought.plus(1),
                }))
                    .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.IncompleteFillBuyQuoteError(makerToken.address, qfr.makerAssetBought, qfr.makerAssetBought.plus(1)))];
            });
        }); });
        it('can fully buy from a single order with maker asset taker fees', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, qfr, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orders = _.times(1, function () {
                            return createOrder({
                                takerFeeAssetData: order_utils_1.assetDataUtils.encodeERC20AssetData(makerToken.address),
                            });
                        });
                        signatures = orders.map(function () { return encodeExchangeBehavior(); });
                        qfr = getExpectedBuyQuoteFillResults(orders);
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                                side: transformer_data_encoders_1.FillQuoteTransformerSide.Buy,
                                fillAmount: qfr.makerAssetBought,
                            }))
                                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought })]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('fails if an order has a non-standard taker fee asset', function () { return __awaiter(_this, void 0, void 0, function () {
            var BAD_ASSET_DATA, orders, signatures, qfr, tx;
            return __generator(this, function (_a) {
                BAD_ASSET_DATA = utils_1.hexUtils.random(36);
                orders = _.times(1, function () { return createOrder({ takerFeeAssetData: BAD_ASSET_DATA }); });
                signatures = orders.map(function () { return encodeExchangeBehavior(); });
                qfr = getExpectedBuyQuoteFillResults(orders);
                tx = host
                    .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                    orders: orders,
                    signatures: signatures,
                    side: transformer_data_encoders_1.FillQuoteTransformerSide.Buy,
                    fillAmount: qfr.makerAssetBought,
                }))
                    .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.InvalidERC20AssetDataError(BAD_ASSET_DATA))];
            });
        }); });
        it('fails if an order has a fee asset that is neither maker or taker asset', function () { return __awaiter(_this, void 0, void 0, function () {
            var badToken, BAD_ASSET_DATA, orders, signatures, qfr, tx;
            return __generator(this, function (_a) {
                badToken = contracts_test_utils_1.randomAddress();
                BAD_ASSET_DATA = utils_1.hexUtils.concat(ERC20_ASSET_PROXY_ID, utils_1.hexUtils.leftPad(badToken));
                orders = _.times(1, function () { return createOrder({ takerFeeAssetData: BAD_ASSET_DATA }); });
                signatures = orders.map(function () { return encodeExchangeBehavior(); });
                qfr = getExpectedBuyQuoteFillResults(orders);
                tx = host
                    .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                    orders: orders,
                    signatures: signatures,
                    side: transformer_data_encoders_1.FillQuoteTransformerSide.Buy,
                    fillAmount: qfr.makerAssetBought,
                }))
                    .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.InvalidTakerFeeTokenError(badToken))];
            });
        }); });
        it('respects `maxOrderFillAmounts`', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, qfr, protocolFee, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orders = _.times(2, function () { return createOrder(); });
                        signatures = orders.map(function () { return encodeExchangeBehavior(); });
                        qfr = getExpectedBuyQuoteFillResults(orders.slice(1));
                        protocolFee = singleProtocolFee.times(2);
                        return [4 /*yield*/, host
                                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, encodeTransformData({
                                orders: orders,
                                signatures: signatures,
                                side: transformer_data_encoders_1.FillQuoteTransformerSide.Buy,
                                fillAmount: qfr.makerAssetBought,
                                // Skip the first order.
                                maxOrderFillAmounts: [ZERO_AMOUNT],
                            }))
                                .awaitTransactionSuccessAsync({ value: protocolFee })];
                    case 1:
                        _b.sent();
                        _a = assertBalances;
                        return [4 /*yield*/, getBalancesAsync(host.address)];
                    case 2:
                        _a.apply(void 0, [_b.sent(), __assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought })]);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=fill_quote_transformer_test.js.map