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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
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
var contracts_test_utils_1 = require("@0x/contracts-test-utils");
var utils_1 = require("@0x/utils");
var _ = require("lodash");
var artifacts_1 = require("./artifacts");
var wrappers_1 = require("./wrappers");
contracts_test_utils_1.blockchainTests('erc20-bridge-sampler', function (env) {
    var testContract;
    var RATE_DENOMINATOR = contracts_test_utils_1.constants.ONE_ETHER;
    var MIN_RATE = new utils_1.BigNumber('0.01');
    var MAX_RATE = new utils_1.BigNumber('100');
    var MIN_DECIMALS = 4;
    var MAX_DECIMALS = 20;
    var WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    var KYBER_SALT = '0x0ff3ca9d46195c39f9a12afb74207b4970349fb3cfb1e459bbf170298d326bc7';
    var ETH2DAI_SALT = '0xb713b61bb9bb2958a0f5d1534b21e94fc68c4c0c034b0902ed844f2f6cd1b4f7';
    var UNISWAP_BASE_SALT = '0x1d6a6a0506b0b4a554b907a4c29d9f4674e461989d9c1921feb17b26716385ab';
    var ERC20_PROXY_ID = '0xf47261b0';
    var INVALID_TOKEN_PAIR_ERROR = 'ERC20BridgeSampler/INVALID_TOKEN_PAIR';
    var MAKER_TOKEN = contracts_test_utils_1.randomAddress();
    var TAKER_TOKEN = contracts_test_utils_1.randomAddress();
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, wrappers_1.TestERC20BridgeSamplerContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestERC20BridgeSampler, env.provider, env.txDefaults, {})];
                case 1:
                    testContract = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    function getPackedHash() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return utils_1.hexUtils.hash(utils_1.hexUtils.concat.apply(utils_1.hexUtils, __spread(args.map(function (a) { return utils_1.hexUtils.toHex(a); }))));
    }
    function getUniswapExchangeSalt(tokenAddress) {
        return getPackedHash(UNISWAP_BASE_SALT, tokenAddress);
    }
    function getDeterministicRate(salt, sellToken, buyToken) {
        var hash = getPackedHash(salt, sellToken, buyToken);
        var _minRate = RATE_DENOMINATOR.times(MIN_RATE);
        var _maxRate = RATE_DENOMINATOR.times(MAX_RATE);
        return new utils_1.BigNumber(hash)
            .mod(_maxRate.minus(_minRate))
            .plus(_minRate)
            .div(RATE_DENOMINATOR);
    }
    function getDeterministicTokenDecimals(token) {
        if (token === WETH_ADDRESS) {
            return 18;
        }
        // HACK(dorothy-zbornak): Linter will complain about the addition not being
        // between two numbers, even though they are.
        // tslint:disable-next-line restrict-plus-operands
        return new utils_1.BigNumber(getPackedHash(token)).mod(MAX_DECIMALS - MIN_DECIMALS).toNumber() + MIN_DECIMALS;
    }
    function getDeterministicSellQuote(salt, sellToken, buyToken, sellAmount) {
        var sellBase = new utils_1.BigNumber(10).pow(getDeterministicTokenDecimals(sellToken));
        var buyBase = new utils_1.BigNumber(10).pow(getDeterministicTokenDecimals(buyToken));
        var rate = getDeterministicRate(salt, sellToken, buyToken);
        return sellAmount
            .times(rate)
            .times(buyBase)
            .dividedToIntegerBy(sellBase);
    }
    function getDeterministicBuyQuote(salt, sellToken, buyToken, buyAmount) {
        var sellBase = new utils_1.BigNumber(10).pow(getDeterministicTokenDecimals(sellToken));
        var buyBase = new utils_1.BigNumber(10).pow(getDeterministicTokenDecimals(buyToken));
        var rate = getDeterministicRate(salt, sellToken, buyToken);
        return buyAmount
            .times(sellBase)
            .dividedToIntegerBy(rate)
            .dividedToIntegerBy(buyBase);
    }
    function areAddressesEqual(a, b) {
        return a.toLowerCase() === b.toLowerCase();
    }
    function getDeterministicUniswapSellQuote(sellToken, buyToken, sellAmount) {
        if (areAddressesEqual(buyToken, WETH_ADDRESS)) {
            return getDeterministicSellQuote(getUniswapExchangeSalt(sellToken), sellToken, WETH_ADDRESS, sellAmount);
        }
        if (areAddressesEqual(sellToken, WETH_ADDRESS)) {
            return getDeterministicSellQuote(getUniswapExchangeSalt(buyToken), buyToken, WETH_ADDRESS, sellAmount);
        }
        var ethBought = getDeterministicSellQuote(getUniswapExchangeSalt(sellToken), sellToken, WETH_ADDRESS, sellAmount);
        return getDeterministicSellQuote(getUniswapExchangeSalt(buyToken), buyToken, WETH_ADDRESS, ethBought);
    }
    function getDeterministicUniswapBuyQuote(sellToken, buyToken, buyAmount) {
        if (areAddressesEqual(buyToken, WETH_ADDRESS)) {
            return getDeterministicBuyQuote(getUniswapExchangeSalt(sellToken), WETH_ADDRESS, sellToken, buyAmount);
        }
        if (areAddressesEqual(sellToken, WETH_ADDRESS)) {
            return getDeterministicBuyQuote(getUniswapExchangeSalt(buyToken), WETH_ADDRESS, buyToken, buyAmount);
        }
        var ethSold = getDeterministicBuyQuote(getUniswapExchangeSalt(buyToken), WETH_ADDRESS, buyToken, buyAmount);
        return getDeterministicBuyQuote(getUniswapExchangeSalt(sellToken), WETH_ADDRESS, sellToken, ethSold);
    }
    function getDeterministicSellQuotes(sellToken, buyToken, sources, sampleAmounts) {
        var e_1, _a, e_2, _b;
        var quotes = [];
        try {
            for (var sources_1 = __values(sources), sources_1_1 = sources_1.next(); !sources_1_1.done; sources_1_1 = sources_1.next()) {
                var source = sources_1_1.value;
                var sampleOutputs = [];
                try {
                    for (var sampleAmounts_1 = __values(sampleAmounts), sampleAmounts_1_1 = sampleAmounts_1.next(); !sampleAmounts_1_1.done; sampleAmounts_1_1 = sampleAmounts_1.next()) {
                        var amount = sampleAmounts_1_1.value;
                        if (source === 'Kyber' || source === 'Eth2Dai') {
                            sampleOutputs.push(getDeterministicSellQuote(source === 'Kyber' ? KYBER_SALT : ETH2DAI_SALT, sellToken, buyToken, amount));
                        }
                        else if (source === 'Uniswap') {
                            sampleOutputs.push(getDeterministicUniswapSellQuote(sellToken, buyToken, amount));
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (sampleAmounts_1_1 && !sampleAmounts_1_1.done && (_b = sampleAmounts_1.return)) _b.call(sampleAmounts_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                quotes.push(sampleOutputs);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (sources_1_1 && !sources_1_1.done && (_a = sources_1.return)) _a.call(sources_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return quotes;
    }
    function getDeterministicBuyQuotes(sellToken, buyToken, sources, sampleAmounts) {
        var e_3, _a, e_4, _b;
        var quotes = [];
        try {
            for (var sources_2 = __values(sources), sources_2_1 = sources_2.next(); !sources_2_1.done; sources_2_1 = sources_2.next()) {
                var source = sources_2_1.value;
                var sampleOutputs = [];
                try {
                    for (var sampleAmounts_2 = __values(sampleAmounts), sampleAmounts_2_1 = sampleAmounts_2.next(); !sampleAmounts_2_1.done; sampleAmounts_2_1 = sampleAmounts_2.next()) {
                        var amount = sampleAmounts_2_1.value;
                        if (source === 'Eth2Dai') {
                            sampleOutputs.push(getDeterministicBuyQuote(ETH2DAI_SALT, sellToken, buyToken, amount));
                        }
                        else if (source === 'Uniswap') {
                            sampleOutputs.push(getDeterministicUniswapBuyQuote(sellToken, buyToken, amount));
                        }
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (sampleAmounts_2_1 && !sampleAmounts_2_1.done && (_b = sampleAmounts_2.return)) _b.call(sampleAmounts_2);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
                quotes.push(sampleOutputs);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (sources_2_1 && !sources_2_1.done && (_a = sources_2.return)) _a.call(sources_2);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return quotes;
    }
    function getDeterministicFillableTakerAssetAmount(order) {
        var hash = getPackedHash(utils_1.hexUtils.leftPad(order.salt));
        var orderStatus = new utils_1.BigNumber(hash).mod(100).toNumber() > 90 ? 5 : 3;
        var isValidSignature = !!new utils_1.BigNumber(hash).mod(2).toNumber();
        if (orderStatus !== 3 || !isValidSignature) {
            return contracts_test_utils_1.constants.ZERO_AMOUNT;
        }
        return order.takerAssetAmount.minus(new utils_1.BigNumber(hash).mod(order.takerAssetAmount));
    }
    function getDeterministicFillableMakerAssetAmount(order) {
        var takerAmount = getDeterministicFillableTakerAssetAmount(order);
        return order.makerAssetAmount
            .times(takerAmount)
            .div(order.takerAssetAmount)
            .integerValue(utils_1.BigNumber.ROUND_UP);
    }
    function getERC20AssetData(tokenAddress) {
        return utils_1.hexUtils.concat(ERC20_PROXY_ID, utils_1.hexUtils.leftPad(tokenAddress));
    }
    function getSampleAmounts(tokenAddress, count) {
        var tokenDecimals = getDeterministicTokenDecimals(tokenAddress);
        var _upperLimit = contracts_test_utils_1.getRandomPortion(contracts_test_utils_1.getRandomInteger(1, 1000).times(Math.pow(10, tokenDecimals)));
        var _count = count || _.random(1, 16);
        var d = _upperLimit.div(_count);
        return _.times(_count, function (i) { return d.times((i + 1) / _count).integerValue(); });
    }
    function createOrder(makerToken, takerToken) {
        return {
            chainId: 1337,
            exchangeAddress: contracts_test_utils_1.randomAddress(),
            makerAddress: contracts_test_utils_1.randomAddress(),
            takerAddress: contracts_test_utils_1.randomAddress(),
            senderAddress: contracts_test_utils_1.randomAddress(),
            feeRecipientAddress: contracts_test_utils_1.randomAddress(),
            makerAssetAmount: contracts_test_utils_1.getRandomInteger(1, 1e18),
            takerAssetAmount: contracts_test_utils_1.getRandomInteger(1, 1e18),
            makerFee: contracts_test_utils_1.getRandomInteger(1, 1e18),
            takerFee: contracts_test_utils_1.getRandomInteger(1, 1e18),
            makerAssetData: getERC20AssetData(makerToken),
            takerAssetData: getERC20AssetData(takerToken),
            makerFeeAssetData: getERC20AssetData(contracts_test_utils_1.randomAddress()),
            takerFeeAssetData: getERC20AssetData(contracts_test_utils_1.randomAddress()),
            salt: new utils_1.BigNumber(utils_1.hexUtils.random()),
            expirationTimeSeconds: contracts_test_utils_1.getRandomInteger(0, Math.pow(2, 32)),
        };
    }
    function createOrders(makerToken, takerToken, count) {
        return _.times(count || _.random(1, 16), function () { return createOrder(makerToken, takerToken); });
    }
    function enableFailTriggerAsync() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, testContract.enableFailTrigger().awaitTransactionSuccessAsync({ value: 1 })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    describe('getOrderFillableTakerAssetAmounts()', function () {
        it('returns the expected amount for each order', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, expected, actual;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orders = createOrders(MAKER_TOKEN, TAKER_TOKEN);
                        signatures = _.times(orders.length, function (i) { return utils_1.hexUtils.random(); });
                        expected = orders.map(getDeterministicFillableTakerAssetAmount);
                        return [4 /*yield*/, testContract.getOrderFillableTakerAssetAmounts(orders, signatures).callAsync()];
                    case 1:
                        actual = _a.sent();
                        contracts_test_utils_1.expect(actual).to.deep.eq(expected);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns empty for no orders', function () { return __awaiter(_this, void 0, void 0, function () {
            var actual;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, testContract.getOrderFillableTakerAssetAmounts([], []).callAsync()];
                    case 1:
                        actual = _a.sent();
                        contracts_test_utils_1.expect(actual).to.deep.eq([]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero for an order with zero maker asset amount', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, actual;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orders = createOrders(MAKER_TOKEN, TAKER_TOKEN, 1);
                        orders[0].makerAssetAmount = contracts_test_utils_1.constants.ZERO_AMOUNT;
                        signatures = _.times(orders.length, function (i) { return utils_1.hexUtils.random(); });
                        return [4 /*yield*/, testContract.getOrderFillableTakerAssetAmounts(orders, signatures).callAsync()];
                    case 1:
                        actual = _a.sent();
                        contracts_test_utils_1.expect(actual).to.deep.eq([contracts_test_utils_1.constants.ZERO_AMOUNT]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero for an order with zero taker asset amount', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, actual;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orders = createOrders(MAKER_TOKEN, TAKER_TOKEN, 1);
                        orders[0].takerAssetAmount = contracts_test_utils_1.constants.ZERO_AMOUNT;
                        signatures = _.times(orders.length, function (i) { return utils_1.hexUtils.random(); });
                        return [4 /*yield*/, testContract.getOrderFillableTakerAssetAmounts(orders, signatures).callAsync()];
                    case 1:
                        actual = _a.sent();
                        contracts_test_utils_1.expect(actual).to.deep.eq([contracts_test_utils_1.constants.ZERO_AMOUNT]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero for an order with an empty signature', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, actual;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orders = createOrders(MAKER_TOKEN, TAKER_TOKEN, 1);
                        signatures = _.times(orders.length, function () { return contracts_test_utils_1.constants.NULL_BYTES; });
                        return [4 /*yield*/, testContract.getOrderFillableTakerAssetAmounts(orders, signatures).callAsync()];
                    case 1:
                        actual = _a.sent();
                        contracts_test_utils_1.expect(actual).to.deep.eq([contracts_test_utils_1.constants.ZERO_AMOUNT]);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getOrderFillableMakerAssetAmounts()', function () {
        it('returns the expected amount for each order', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, expected, actual;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orders = createOrders(MAKER_TOKEN, TAKER_TOKEN);
                        signatures = _.times(orders.length, function (i) { return utils_1.hexUtils.random(); });
                        expected = orders.map(getDeterministicFillableMakerAssetAmount);
                        return [4 /*yield*/, testContract.getOrderFillableMakerAssetAmounts(orders, signatures).callAsync()];
                    case 1:
                        actual = _a.sent();
                        contracts_test_utils_1.expect(actual).to.deep.eq(expected);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns empty for no orders', function () { return __awaiter(_this, void 0, void 0, function () {
            var actual;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, testContract.getOrderFillableMakerAssetAmounts([], []).callAsync()];
                    case 1:
                        actual = _a.sent();
                        contracts_test_utils_1.expect(actual).to.deep.eq([]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero for an order with zero maker asset amount', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, actual;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orders = createOrders(MAKER_TOKEN, TAKER_TOKEN, 1);
                        orders[0].makerAssetAmount = contracts_test_utils_1.constants.ZERO_AMOUNT;
                        signatures = _.times(orders.length, function (i) { return utils_1.hexUtils.random(); });
                        return [4 /*yield*/, testContract.getOrderFillableMakerAssetAmounts(orders, signatures).callAsync()];
                    case 1:
                        actual = _a.sent();
                        contracts_test_utils_1.expect(actual).to.deep.eq([contracts_test_utils_1.constants.ZERO_AMOUNT]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero for an order with zero taker asset amount', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, actual;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orders = createOrders(MAKER_TOKEN, TAKER_TOKEN, 1);
                        orders[0].takerAssetAmount = contracts_test_utils_1.constants.ZERO_AMOUNT;
                        signatures = _.times(orders.length, function (i) { return utils_1.hexUtils.random(); });
                        return [4 /*yield*/, testContract.getOrderFillableMakerAssetAmounts(orders, signatures).callAsync()];
                    case 1:
                        actual = _a.sent();
                        contracts_test_utils_1.expect(actual).to.deep.eq([contracts_test_utils_1.constants.ZERO_AMOUNT]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero for an order with an empty signature', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, actual;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orders = createOrders(MAKER_TOKEN, TAKER_TOKEN, 1);
                        signatures = _.times(orders.length, function () { return contracts_test_utils_1.constants.NULL_BYTES; });
                        return [4 /*yield*/, testContract.getOrderFillableMakerAssetAmounts(orders, signatures).callAsync()];
                    case 1:
                        actual = _a.sent();
                        contracts_test_utils_1.expect(actual).to.deep.eq([contracts_test_utils_1.constants.ZERO_AMOUNT]);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    contracts_test_utils_1.blockchainTests.resets('sampleSellsFromKyberNetwork()', function () {
        before(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, testContract.createTokenExchanges([MAKER_TOKEN, TAKER_TOKEN]).awaitTransactionSuccessAsync()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('throws if tokens are the same', function () { return __awaiter(_this, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                tx = testContract.sampleSellsFromKyberNetwork(MAKER_TOKEN, MAKER_TOKEN, []).callAsync();
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(INVALID_TOKEN_PAIR_ERROR)];
            });
        }); });
        it('can return no quotes', function () { return __awaiter(_this, void 0, void 0, function () {
            var quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, testContract.sampleSellsFromKyberNetwork(TAKER_TOKEN, MAKER_TOKEN, []).callAsync()];
                    case 1:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq([]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can quote token - token', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, _a, expectedQuotes, quotes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        _a = __read(getDeterministicSellQuotes(TAKER_TOKEN, MAKER_TOKEN, ['Kyber'], sampleAmounts), 1), expectedQuotes = _a[0];
                        return [4 /*yield*/, testContract
                                .sampleSellsFromKyberNetwork(TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _b.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if token -> token fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, enableFailTriggerAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, testContract
                                .sampleSellsFromKyberNetwork(TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 2:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can quote token -> ETH', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, _a, expectedQuotes, quotes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        _a = __read(getDeterministicSellQuotes(TAKER_TOKEN, WETH_ADDRESS, ['Kyber'], sampleAmounts), 1), expectedQuotes = _a[0];
                        return [4 /*yield*/, testContract
                                .sampleSellsFromKyberNetwork(TAKER_TOKEN, WETH_ADDRESS, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _b.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if token -> ETH fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, enableFailTriggerAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, testContract
                                .sampleSellsFromKyberNetwork(TAKER_TOKEN, WETH_ADDRESS, sampleAmounts)
                                .callAsync()];
                    case 2:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can quote ETH -> token', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, _a, expectedQuotes, quotes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        _a = __read(getDeterministicSellQuotes(WETH_ADDRESS, TAKER_TOKEN, ['Kyber'], sampleAmounts), 1), expectedQuotes = _a[0];
                        return [4 /*yield*/, testContract
                                .sampleSellsFromKyberNetwork(WETH_ADDRESS, TAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _b.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if ETH -> token fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, enableFailTriggerAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, testContract
                                .sampleSellsFromKyberNetwork(WETH_ADDRESS, TAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 2:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    contracts_test_utils_1.blockchainTests.resets('sampleSellsFromEth2Dai()', function () {
        before(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, testContract.createTokenExchanges([MAKER_TOKEN, TAKER_TOKEN]).awaitTransactionSuccessAsync()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('throws if tokens are the same', function () { return __awaiter(_this, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                tx = testContract.sampleSellsFromEth2Dai(MAKER_TOKEN, MAKER_TOKEN, []).callAsync();
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(INVALID_TOKEN_PAIR_ERROR)];
            });
        }); });
        it('can return no quotes', function () { return __awaiter(_this, void 0, void 0, function () {
            var quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, testContract.sampleSellsFromEth2Dai(TAKER_TOKEN, MAKER_TOKEN, []).callAsync()];
                    case 1:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq([]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can quote token -> token', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, _a, expectedQuotes, quotes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        _a = __read(getDeterministicSellQuotes(TAKER_TOKEN, MAKER_TOKEN, ['Eth2Dai'], sampleAmounts), 1), expectedQuotes = _a[0];
                        return [4 /*yield*/, testContract
                                .sampleSellsFromEth2Dai(TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _b.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if token -> token fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, enableFailTriggerAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, testContract
                                .sampleSellsFromEth2Dai(TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 2:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can quote token -> ETH', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, _a, expectedQuotes, quotes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        _a = __read(getDeterministicSellQuotes(TAKER_TOKEN, WETH_ADDRESS, ['Eth2Dai'], sampleAmounts), 1), expectedQuotes = _a[0];
                        return [4 /*yield*/, testContract
                                .sampleSellsFromEth2Dai(TAKER_TOKEN, WETH_ADDRESS, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _b.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if token -> ETH fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, enableFailTriggerAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, testContract
                                .sampleSellsFromEth2Dai(TAKER_TOKEN, WETH_ADDRESS, sampleAmounts)
                                .callAsync()];
                    case 2:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can quote ETH -> token', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, _a, expectedQuotes, quotes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        _a = __read(getDeterministicSellQuotes(WETH_ADDRESS, TAKER_TOKEN, ['Eth2Dai'], sampleAmounts), 1), expectedQuotes = _a[0];
                        return [4 /*yield*/, testContract
                                .sampleSellsFromEth2Dai(WETH_ADDRESS, TAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _b.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if ETH -> token fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, enableFailTriggerAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, testContract
                                .sampleSellsFromEth2Dai(WETH_ADDRESS, TAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 2:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    contracts_test_utils_1.blockchainTests.resets('sampleBuysFromEth2Dai()', function () {
        before(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, testContract.createTokenExchanges([MAKER_TOKEN, TAKER_TOKEN]).awaitTransactionSuccessAsync()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('throws if tokens are the same', function () { return __awaiter(_this, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                tx = testContract.sampleBuysFromEth2Dai(MAKER_TOKEN, MAKER_TOKEN, []).callAsync();
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(INVALID_TOKEN_PAIR_ERROR)];
            });
        }); });
        it('can return no quotes', function () { return __awaiter(_this, void 0, void 0, function () {
            var quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, testContract.sampleBuysFromEth2Dai(TAKER_TOKEN, MAKER_TOKEN, []).callAsync()];
                    case 1:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq([]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can quote token -> token', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, _a, expectedQuotes, quotes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(MAKER_TOKEN);
                        _a = __read(getDeterministicBuyQuotes(TAKER_TOKEN, MAKER_TOKEN, ['Eth2Dai'], sampleAmounts), 1), expectedQuotes = _a[0];
                        return [4 /*yield*/, testContract
                                .sampleBuysFromEth2Dai(TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _b.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if token -> token fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(MAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, enableFailTriggerAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, testContract
                                .sampleBuysFromEth2Dai(TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 2:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can quote token -> ETH', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, _a, expectedQuotes, quotes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(MAKER_TOKEN);
                        _a = __read(getDeterministicBuyQuotes(TAKER_TOKEN, WETH_ADDRESS, ['Eth2Dai'], sampleAmounts), 1), expectedQuotes = _a[0];
                        return [4 /*yield*/, testContract
                                .sampleBuysFromEth2Dai(TAKER_TOKEN, WETH_ADDRESS, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _b.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if token -> ETH fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(MAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, enableFailTriggerAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, testContract
                                .sampleBuysFromEth2Dai(TAKER_TOKEN, WETH_ADDRESS, sampleAmounts)
                                .callAsync()];
                    case 2:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can quote ETH -> token', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, _a, expectedQuotes, quotes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(MAKER_TOKEN);
                        _a = __read(getDeterministicBuyQuotes(WETH_ADDRESS, TAKER_TOKEN, ['Eth2Dai'], sampleAmounts), 1), expectedQuotes = _a[0];
                        return [4 /*yield*/, testContract
                                .sampleBuysFromEth2Dai(WETH_ADDRESS, TAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _b.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if ETH -> token fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(MAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, enableFailTriggerAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, testContract
                                .sampleBuysFromEth2Dai(WETH_ADDRESS, TAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 2:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    contracts_test_utils_1.blockchainTests.resets('sampleSellsFromUniswap()', function () {
        before(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, testContract.createTokenExchanges([MAKER_TOKEN, TAKER_TOKEN]).awaitTransactionSuccessAsync()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('throws if tokens are the same', function () { return __awaiter(_this, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                tx = testContract.sampleSellsFromUniswap(MAKER_TOKEN, MAKER_TOKEN, []).callAsync();
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(INVALID_TOKEN_PAIR_ERROR)];
            });
        }); });
        it('can return no quotes', function () { return __awaiter(_this, void 0, void 0, function () {
            var quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, testContract.sampleSellsFromUniswap(TAKER_TOKEN, MAKER_TOKEN, []).callAsync()];
                    case 1:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq([]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can quote token -> token', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, _a, expectedQuotes, quotes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        _a = __read(getDeterministicSellQuotes(TAKER_TOKEN, MAKER_TOKEN, ['Uniswap'], sampleAmounts), 1), expectedQuotes = _a[0];
                        return [4 /*yield*/, testContract
                                .sampleSellsFromUniswap(TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _b.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if token -> token fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, enableFailTriggerAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, testContract
                                .sampleSellsFromUniswap(TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 2:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can quote token -> ETH', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, _a, expectedQuotes, quotes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        _a = __read(getDeterministicSellQuotes(TAKER_TOKEN, WETH_ADDRESS, ['Uniswap'], sampleAmounts), 1), expectedQuotes = _a[0];
                        return [4 /*yield*/, testContract
                                .sampleSellsFromUniswap(TAKER_TOKEN, WETH_ADDRESS, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _b.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if token -> ETH fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, enableFailTriggerAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, testContract
                                .sampleSellsFromUniswap(TAKER_TOKEN, WETH_ADDRESS, sampleAmounts)
                                .callAsync()];
                    case 2:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can quote ETH -> token', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, _a, expectedQuotes, quotes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        _a = __read(getDeterministicSellQuotes(WETH_ADDRESS, TAKER_TOKEN, ['Uniswap'], sampleAmounts), 1), expectedQuotes = _a[0];
                        return [4 /*yield*/, testContract
                                .sampleSellsFromUniswap(WETH_ADDRESS, TAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _b.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if ETH -> token fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, enableFailTriggerAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, testContract
                                .sampleSellsFromUniswap(WETH_ADDRESS, TAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 2:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if no exchange exists for the maker token', function () { return __awaiter(_this, void 0, void 0, function () {
            var nonExistantToken, sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nonExistantToken = contracts_test_utils_1.randomAddress();
                        sampleAmounts = getSampleAmounts(TAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, testContract
                                .sampleSellsFromUniswap(TAKER_TOKEN, nonExistantToken, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if no exchange exists for the taker token', function () { return __awaiter(_this, void 0, void 0, function () {
            var nonExistantToken, sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nonExistantToken = contracts_test_utils_1.randomAddress();
                        sampleAmounts = getSampleAmounts(nonExistantToken);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, testContract
                                .sampleSellsFromUniswap(nonExistantToken, MAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    contracts_test_utils_1.blockchainTests.resets('sampleBuysFromUniswap()', function () {
        before(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, testContract.createTokenExchanges([MAKER_TOKEN, TAKER_TOKEN]).awaitTransactionSuccessAsync()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('throws if tokens are the same', function () { return __awaiter(_this, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                tx = testContract.sampleBuysFromUniswap(MAKER_TOKEN, MAKER_TOKEN, []).callAsync();
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(INVALID_TOKEN_PAIR_ERROR)];
            });
        }); });
        it('can return no quotes', function () { return __awaiter(_this, void 0, void 0, function () {
            var quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, testContract.sampleBuysFromUniswap(TAKER_TOKEN, MAKER_TOKEN, []).callAsync()];
                    case 1:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq([]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can quote token -> token', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, _a, expectedQuotes, quotes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(MAKER_TOKEN);
                        _a = __read(getDeterministicBuyQuotes(TAKER_TOKEN, MAKER_TOKEN, ['Uniswap'], sampleAmounts), 1), expectedQuotes = _a[0];
                        return [4 /*yield*/, testContract
                                .sampleBuysFromUniswap(TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _b.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if token -> token fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(MAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, enableFailTriggerAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, testContract
                                .sampleBuysFromUniswap(TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 2:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can quote token -> ETH', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, _a, expectedQuotes, quotes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(MAKER_TOKEN);
                        _a = __read(getDeterministicBuyQuotes(TAKER_TOKEN, WETH_ADDRESS, ['Uniswap'], sampleAmounts), 1), expectedQuotes = _a[0];
                        return [4 /*yield*/, testContract
                                .sampleBuysFromUniswap(TAKER_TOKEN, WETH_ADDRESS, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _b.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if token -> ETH fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(MAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, enableFailTriggerAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, testContract
                                .sampleBuysFromUniswap(TAKER_TOKEN, WETH_ADDRESS, sampleAmounts)
                                .callAsync()];
                    case 2:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can quote ETH -> token', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, _a, expectedQuotes, quotes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(MAKER_TOKEN);
                        _a = __read(getDeterministicBuyQuotes(WETH_ADDRESS, TAKER_TOKEN, ['Uniswap'], sampleAmounts), 1), expectedQuotes = _a[0];
                        return [4 /*yield*/, testContract
                                .sampleBuysFromUniswap(WETH_ADDRESS, TAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _b.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if ETH -> token fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sampleAmounts = getSampleAmounts(MAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, enableFailTriggerAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, testContract
                                .sampleBuysFromUniswap(WETH_ADDRESS, TAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 2:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if no exchange exists for the maker token', function () { return __awaiter(_this, void 0, void 0, function () {
            var nonExistantToken, sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nonExistantToken = contracts_test_utils_1.randomAddress();
                        sampleAmounts = getSampleAmounts(nonExistantToken);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, testContract
                                .sampleBuysFromUniswap(TAKER_TOKEN, nonExistantToken, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns zero if no exchange exists for the taker token', function () { return __awaiter(_this, void 0, void 0, function () {
            var nonExistantToken, sampleAmounts, expectedQuotes, quotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nonExistantToken = contracts_test_utils_1.randomAddress();
                        sampleAmounts = getSampleAmounts(MAKER_TOKEN);
                        expectedQuotes = _.times(sampleAmounts.length, function () { return contracts_test_utils_1.constants.ZERO_AMOUNT; });
                        return [4 /*yield*/, testContract
                                .sampleBuysFromUniswap(nonExistantToken, MAKER_TOKEN, sampleAmounts)
                                .callAsync()];
                    case 1:
                        quotes = _a.sent();
                        contracts_test_utils_1.expect(quotes).to.deep.eq(expectedQuotes);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('batchCall()', function () {
        it('can call one function', function () { return __awaiter(_this, void 0, void 0, function () {
            var orders, signatures, expected, calls, r, actual;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orders = createOrders(MAKER_TOKEN, TAKER_TOKEN);
                        signatures = _.times(orders.length, function (i) { return utils_1.hexUtils.random(); });
                        expected = orders.map(getDeterministicFillableTakerAssetAmount);
                        calls = [
                            testContract.getOrderFillableTakerAssetAmounts(orders, signatures).getABIEncodedTransactionData(),
                        ];
                        return [4 /*yield*/, testContract.batchCall(calls).callAsync()];
                    case 1:
                        r = _a.sent();
                        contracts_test_utils_1.expect(r).to.be.length(1);
                        actual = testContract.getABIDecodedReturnData('getOrderFillableTakerAssetAmounts', r[0]);
                        contracts_test_utils_1.expect(actual).to.deep.eq(expected);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can call two functions', function () { return __awaiter(_this, void 0, void 0, function () {
            var numOrders, orders, signatures, expecteds, calls, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        numOrders = _.random(1, 10);
                        orders = _.times(2, function () { return createOrders(MAKER_TOKEN, TAKER_TOKEN, numOrders); });
                        signatures = _.times(numOrders, function (i) { return utils_1.hexUtils.random(); });
                        expecteds = [
                            orders[0].map(getDeterministicFillableTakerAssetAmount),
                            orders[1].map(getDeterministicFillableMakerAssetAmount),
                        ];
                        calls = [
                            testContract.getOrderFillableTakerAssetAmounts(orders[0], signatures).getABIEncodedTransactionData(),
                            testContract.getOrderFillableMakerAssetAmounts(orders[1], signatures).getABIEncodedTransactionData(),
                        ];
                        return [4 /*yield*/, testContract.batchCall(calls).callAsync()];
                    case 1:
                        r = _a.sent();
                        contracts_test_utils_1.expect(r).to.be.length(2);
                        contracts_test_utils_1.expect(testContract.getABIDecodedReturnData('getOrderFillableTakerAssetAmounts', r[0])).to.deep.eq(expecteds[0]);
                        contracts_test_utils_1.expect(testContract.getABIDecodedReturnData('getOrderFillableMakerAssetAmounts', r[1])).to.deep.eq(expecteds[1]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can make recursive calls', function () { return __awaiter(_this, void 0, void 0, function () {
            var numOrders, orders, signatures, expected, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        numOrders = _.random(1, 10);
                        orders = createOrders(MAKER_TOKEN, TAKER_TOKEN, numOrders);
                        signatures = _.times(numOrders, function (i) { return utils_1.hexUtils.random(); });
                        expected = orders.map(getDeterministicFillableTakerAssetAmount);
                        return [4 /*yield*/, testContract
                                .batchCall([
                                testContract
                                    .batchCall([
                                    testContract
                                        .getOrderFillableTakerAssetAmounts(orders, signatures)
                                        .getABIEncodedTransactionData(),
                                ])
                                    .getABIEncodedTransactionData(),
                            ])
                                .callAsync()];
                    case 1:
                        r = _a.sent();
                        contracts_test_utils_1.expect(r).to.be.length(1);
                        r = testContract.getABIDecodedReturnData('batchCall', r[0]);
                        contracts_test_utils_1.expect(r).to.be.length(1);
                        contracts_test_utils_1.expect(testContract.getABIDecodedReturnData('getOrderFillableTakerAssetAmounts', r[0])).to.deep.eq(expected);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=erc20-bridge-sampler.js.map