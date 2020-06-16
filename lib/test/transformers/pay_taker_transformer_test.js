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
var contracts_test_utils_1 = require("@0x/contracts-test-utils");
var utils_1 = require("@0x/utils");
var _ = require("lodash");
var constants_1 = require("../../src/constants");
var transformer_data_encoders_1 = require("../../src/transformer_data_encoders");
var artifacts_1 = require("../artifacts");
var wrappers_1 = require("../wrappers");
var MAX_UINT256 = contracts_test_utils_1.constants.MAX_UINT256, ZERO_AMOUNT = contracts_test_utils_1.constants.ZERO_AMOUNT;
contracts_test_utils_1.blockchainTests.resets('PayTakerTransformer', function (env) {
    var taker = contracts_test_utils_1.randomAddress();
    var caller;
    var token;
    var transformer;
    var host;
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, env.getAccountAddressesAsync()];
                case 1:
                    _a = __read.apply(void 0, [_b.sent(), 1]), caller = _a[0];
                    return [4 /*yield*/, wrappers_1.TestMintableERC20TokenContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestMintableERC20Token, env.provider, env.txDefaults, artifacts_1.artifacts)];
                case 2:
                    token = _b.sent();
                    return [4 /*yield*/, wrappers_1.PayTakerTransformerContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.PayTakerTransformer, env.provider, env.txDefaults, artifacts_1.artifacts)];
                case 3:
                    transformer = _b.sent();
                    return [4 /*yield*/, wrappers_1.TestTransformerHostContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestTransformerHost, env.provider, __assign({}, env.txDefaults, { from: caller }), artifacts_1.artifacts)];
                case 4:
                    host = _b.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    var ZERO_BALANCES = {
        ethBalance: ZERO_AMOUNT,
        tokenBalance: ZERO_AMOUNT,
    };
    function getBalancesAsync(owner) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = {};
                        return [4 /*yield*/, env.web3Wrapper.getBalanceInWeiAsync(owner)];
                    case 1:
                        _a.ethBalance = _b.sent();
                        return [4 /*yield*/, token.balanceOf(owner).callAsync()];
                    case 2: return [2 /*return*/, (_a.tokenBalance = _b.sent(),
                            _a)];
                }
            });
        });
    }
    function mintHostTokensAsync(amount) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, token.mint(host.address, amount).awaitTransactionSuccessAsync()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    function sendEtherAsync(to, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = (_a = env.web3Wrapper).awaitTransactionSuccessAsync;
                        return [4 /*yield*/, env.web3Wrapper.sendTransactionAsync(__assign({}, env.txDefaults, { to: to, from: caller, value: amount }))];
                    case 1: return [4 /*yield*/, _b.apply(_a, [_c.sent()])];
                    case 2:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    it('can transfer a token and ETH', function () { return __awaiter(_this, void 0, void 0, function () {
        var amounts, data, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    amounts = _.times(2, function () { return contracts_test_utils_1.getRandomInteger(1, '1e18'); });
                    data = transformer_data_encoders_1.encodePayTakerTransformerData({
                        amounts: amounts,
                        tokens: [token.address, constants_1.ETH_TOKEN_ADDRESS],
                    });
                    return [4 /*yield*/, mintHostTokensAsync(amounts[0])];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, sendEtherAsync(host.address, amounts[1])];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, host
                            .rawExecuteTransform(transformer.address, utils_1.hexUtils.random(), taker, data)
                            .awaitTransactionSuccessAsync()];
                case 3:
                    _c.sent();
                    _a = contracts_test_utils_1.expect;
                    return [4 /*yield*/, getBalancesAsync(host.address)];
                case 4:
                    _a.apply(void 0, [_c.sent()]).to.deep.eq(ZERO_BALANCES);
                    _b = contracts_test_utils_1.expect;
                    return [4 /*yield*/, getBalancesAsync(taker)];
                case 5:
                    _b.apply(void 0, [_c.sent()]).to.deep.eq({
                        tokenBalance: amounts[0],
                        ethBalance: amounts[1],
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('can transfer all of a token and ETH', function () { return __awaiter(_this, void 0, void 0, function () {
        var amounts, data, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    amounts = _.times(2, function () { return contracts_test_utils_1.getRandomInteger(1, '1e18'); });
                    data = transformer_data_encoders_1.encodePayTakerTransformerData({
                        amounts: [MAX_UINT256, MAX_UINT256],
                        tokens: [token.address, constants_1.ETH_TOKEN_ADDRESS],
                    });
                    return [4 /*yield*/, mintHostTokensAsync(amounts[0])];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, sendEtherAsync(host.address, amounts[1])];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, host
                            .rawExecuteTransform(transformer.address, utils_1.hexUtils.random(), taker, data)
                            .awaitTransactionSuccessAsync()];
                case 3:
                    _c.sent();
                    _a = contracts_test_utils_1.expect;
                    return [4 /*yield*/, getBalancesAsync(host.address)];
                case 4:
                    _a.apply(void 0, [_c.sent()]).to.deep.eq(ZERO_BALANCES);
                    _b = contracts_test_utils_1.expect;
                    return [4 /*yield*/, getBalancesAsync(taker)];
                case 5:
                    _b.apply(void 0, [_c.sent()]).to.deep.eq({
                        tokenBalance: amounts[0],
                        ethBalance: amounts[1],
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('can transfer all of a token and ETH (empty amounts)', function () { return __awaiter(_this, void 0, void 0, function () {
        var amounts, data, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    amounts = _.times(2, function () { return contracts_test_utils_1.getRandomInteger(1, '1e18'); });
                    data = transformer_data_encoders_1.encodePayTakerTransformerData({
                        amounts: [],
                        tokens: [token.address, constants_1.ETH_TOKEN_ADDRESS],
                    });
                    return [4 /*yield*/, mintHostTokensAsync(amounts[0])];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, sendEtherAsync(host.address, amounts[1])];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, host
                            .rawExecuteTransform(transformer.address, utils_1.hexUtils.random(), taker, data)
                            .awaitTransactionSuccessAsync()];
                case 3:
                    _c.sent();
                    _a = contracts_test_utils_1.expect;
                    return [4 /*yield*/, getBalancesAsync(host.address)];
                case 4:
                    _a.apply(void 0, [_c.sent()]).to.deep.eq(ZERO_BALANCES);
                    _b = contracts_test_utils_1.expect;
                    return [4 /*yield*/, getBalancesAsync(taker)];
                case 5:
                    _b.apply(void 0, [_c.sent()]).to.deep.eq({
                        tokenBalance: amounts[0],
                        ethBalance: amounts[1],
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('can transfer less than the balance of a token and ETH', function () { return __awaiter(_this, void 0, void 0, function () {
        var amounts, data, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    amounts = _.times(2, function () { return contracts_test_utils_1.getRandomInteger(1, '1e18'); });
                    data = transformer_data_encoders_1.encodePayTakerTransformerData({
                        amounts: amounts.map(function (a) { return a.dividedToIntegerBy(2); }),
                        tokens: [token.address, constants_1.ETH_TOKEN_ADDRESS],
                    });
                    return [4 /*yield*/, mintHostTokensAsync(amounts[0])];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, sendEtherAsync(host.address, amounts[1])];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, host
                            .rawExecuteTransform(transformer.address, utils_1.hexUtils.random(), taker, data)
                            .awaitTransactionSuccessAsync()];
                case 3:
                    _c.sent();
                    _a = contracts_test_utils_1.expect;
                    return [4 /*yield*/, getBalancesAsync(host.address)];
                case 4:
                    _a.apply(void 0, [_c.sent()]).to.deep.eq({
                        tokenBalance: amounts[0].minus(amounts[0].dividedToIntegerBy(2)),
                        ethBalance: amounts[1].minus(amounts[1].dividedToIntegerBy(2)),
                    });
                    _b = contracts_test_utils_1.expect;
                    return [4 /*yield*/, getBalancesAsync(taker)];
                case 5:
                    _b.apply(void 0, [_c.sent()]).to.deep.eq({
                        tokenBalance: amounts[0].dividedToIntegerBy(2),
                        ethBalance: amounts[1].dividedToIntegerBy(2),
                    });
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=pay_taker_transformer_test.js.map