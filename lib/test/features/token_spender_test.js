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
var contracts_test_utils_1 = require("@0x/contracts-test-utils");
var utils_1 = require("@0x/utils");
var artifacts_1 = require("../artifacts");
var abis_1 = require("../utils/abis");
var migration_1 = require("../utils/migration");
var wrappers_1 = require("../wrappers");
contracts_test_utils_1.blockchainTests.resets('TokenSpender feature', function (env) {
    var zeroEx;
    var feature;
    var token;
    var allowanceTarget;
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, owner, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, env.getAccountAddressesAsync()];
                case 1:
                    _a = __read.apply(void 0, [_e.sent(), 1]), owner = _a[0];
                    _b = migration_1.fullMigrateAsync;
                    _c = [owner, env.provider, env.txDefaults];
                    _d = {};
                    return [4 /*yield*/, wrappers_1.TokenSpenderContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestTokenSpender, env.provider, env.txDefaults, artifacts_1.artifacts)];
                case 2: return [4 /*yield*/, _b.apply(void 0, _c.concat([(_d.tokenSpender = _e.sent(),
                            _d)]))];
                case 3:
                    zeroEx = _e.sent();
                    feature = new wrappers_1.TokenSpenderContract(zeroEx.address, env.provider, env.txDefaults, abis_1.abis);
                    return [4 /*yield*/, wrappers_1.TestTokenSpenderERC20TokenContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestTokenSpenderERC20Token, env.provider, env.txDefaults, artifacts_1.artifacts)];
                case 4:
                    token = _e.sent();
                    return [4 /*yield*/, feature.getAllowanceTarget().callAsync()];
                case 5:
                    allowanceTarget = _e.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    describe('_spendERC20Tokens()', function () {
        var EMPTY_RETURN_AMOUNT = 1337;
        var FALSE_RETURN_AMOUNT = 1338;
        var REVERT_RETURN_AMOUNT = 1339;
        it('_spendERC20Tokens() successfully calls compliant ERC20 token', function () { return __awaiter(_this, void 0, void 0, function () {
            var tokenFrom, tokenTo, tokenAmount, receipt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tokenFrom = contracts_test_utils_1.randomAddress();
                        tokenTo = contracts_test_utils_1.randomAddress();
                        tokenAmount = new utils_1.BigNumber(123456);
                        return [4 /*yield*/, feature
                                ._spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
                                .awaitTransactionSuccessAsync()];
                    case 1:
                        receipt = _a.sent();
                        contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                            {
                                sender: allowanceTarget,
                                from: tokenFrom,
                                to: tokenTo,
                                amount: tokenAmount,
                            },
                        ], wrappers_1.TestTokenSpenderERC20TokenEvents.TransferFromCalled);
                        return [2 /*return*/];
                }
            });
        }); });
        it('_spendERC20Tokens() successfully calls non-compliant ERC20 token', function () { return __awaiter(_this, void 0, void 0, function () {
            var tokenFrom, tokenTo, tokenAmount, receipt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tokenFrom = contracts_test_utils_1.randomAddress();
                        tokenTo = contracts_test_utils_1.randomAddress();
                        tokenAmount = new utils_1.BigNumber(EMPTY_RETURN_AMOUNT);
                        return [4 /*yield*/, feature
                                ._spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
                                .awaitTransactionSuccessAsync()];
                    case 1:
                        receipt = _a.sent();
                        contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                            {
                                sender: allowanceTarget,
                                from: tokenFrom,
                                to: tokenTo,
                                amount: tokenAmount,
                            },
                        ], wrappers_1.TestTokenSpenderERC20TokenEvents.TransferFromCalled);
                        return [2 /*return*/];
                }
            });
        }); });
        it('_spendERC20Tokens() reverts if ERC20 token reverts', function () { return __awaiter(_this, void 0, void 0, function () {
            var tokenFrom, tokenTo, tokenAmount, tx, expectedError;
            return __generator(this, function (_a) {
                tokenFrom = contracts_test_utils_1.randomAddress();
                tokenTo = contracts_test_utils_1.randomAddress();
                tokenAmount = new utils_1.BigNumber(REVERT_RETURN_AMOUNT);
                tx = feature
                    ._spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
                    .awaitTransactionSuccessAsync();
                expectedError = new utils_1.ZeroExRevertErrors.Spender.SpenderERC20TransferFromFailedError(token.address, tokenFrom, tokenTo, tokenAmount, new utils_1.StringRevertError('TestTokenSpenderERC20Token/Revert').encode());
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(expectedError)];
            });
        }); });
        it('_spendERC20Tokens() reverts if ERC20 token returns false', function () { return __awaiter(_this, void 0, void 0, function () {
            var tokenFrom, tokenTo, tokenAmount, tx;
            return __generator(this, function (_a) {
                tokenFrom = contracts_test_utils_1.randomAddress();
                tokenTo = contracts_test_utils_1.randomAddress();
                tokenAmount = new utils_1.BigNumber(FALSE_RETURN_AMOUNT);
                tx = feature
                    ._spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
                    .awaitTransactionSuccessAsync();
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Spender.SpenderERC20TransferFromFailedError(token.address, tokenFrom, tokenTo, tokenAmount, utils_1.hexUtils.leftPad(0)))];
            });
        }); });
    });
    describe('getSpendableERC20BalanceOf()', function () {
        it("returns the minimum of the owner's balance and allowance", function () { return __awaiter(_this, void 0, void 0, function () {
            var balance, allowance, tokenOwner, spendableBalance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        balance = contracts_test_utils_1.getRandomInteger(1, '1e18');
                        allowance = contracts_test_utils_1.getRandomInteger(1, '1e18');
                        tokenOwner = contracts_test_utils_1.randomAddress();
                        return [4 /*yield*/, token
                                .setBalanceAndAllowanceOf(tokenOwner, balance, allowanceTarget, allowance)
                                .awaitTransactionSuccessAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, feature.getSpendableERC20BalanceOf(token.address, tokenOwner).callAsync()];
                    case 2:
                        spendableBalance = _a.sent();
                        contracts_test_utils_1.expect(spendableBalance).to.bignumber.eq(utils_1.BigNumber.min(balance, allowance));
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=token_spender_test.js.map