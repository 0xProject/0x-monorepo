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
var artifacts_1 = require("./artifacts");
var wrappers_1 = require("./wrappers");
contracts_test_utils_1.blockchainTests.resets('AllowanceTarget', function (env) {
    var owner;
    var authority;
    var allowanceTarget;
    var callTarget;
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, env.getAccountAddressesAsync()];
                case 1:
                    _a = __read.apply(void 0, [_b.sent(), 2]), owner = _a[0], authority = _a[1];
                    return [4 /*yield*/, wrappers_1.AllowanceTargetContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.AllowanceTarget, env.provider, env.txDefaults, artifacts_1.artifacts)];
                case 2:
                    allowanceTarget = _b.sent();
                    return [4 /*yield*/, allowanceTarget.addAuthorizedAddress(authority).awaitTransactionSuccessAsync()];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, wrappers_1.TestCallTargetContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestCallTarget, env.provider, env.txDefaults, artifacts_1.artifacts)];
                case 4:
                    callTarget = _b.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    var TARGET_RETURN_VALUE = utils_1.hexUtils.rightPad('0x12345678');
    var REVERTING_DATA = '0x1337';
    describe('executeCall()', function () {
        it('non-authority cannot call executeCall()', function () { return __awaiter(_this, void 0, void 0, function () {
            var notAuthority, tx;
            return __generator(this, function (_a) {
                notAuthority = contracts_test_utils_1.randomAddress();
                tx = allowanceTarget
                    .executeCall(contracts_test_utils_1.randomAddress(), utils_1.hexUtils.random())
                    .callAsync({ from: notAuthority });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthority))];
            });
        }); });
        it('authority can call executeCall()', function () { return __awaiter(_this, void 0, void 0, function () {
            var targetData, receipt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        targetData = utils_1.hexUtils.random(128);
                        return [4 /*yield*/, allowanceTarget
                                .executeCall(callTarget.address, targetData)
                                .awaitTransactionSuccessAsync({ from: authority })];
                    case 1:
                        receipt = _a.sent();
                        contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                            {
                                context: callTarget.address,
                                sender: allowanceTarget.address,
                                data: targetData,
                                value: contracts_test_utils_1.constants.ZERO_AMOUNT,
                            },
                        ], wrappers_1.TestCallTargetEvents.CallTargetCalled);
                        return [2 /*return*/];
                }
            });
        }); });
        it('AllowanceTarget returns call result', function () { return __awaiter(_this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, allowanceTarget
                            .executeCall(callTarget.address, utils_1.hexUtils.random(128))
                            .callAsync({ from: authority })];
                    case 1:
                        result = _a.sent();
                        contracts_test_utils_1.expect(result).to.eq(TARGET_RETURN_VALUE);
                        return [2 /*return*/];
                }
            });
        }); });
        it('AllowanceTarget returns raw call revert', function () { return __awaiter(_this, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                tx = allowanceTarget.executeCall(callTarget.address, REVERTING_DATA).callAsync({ from: authority });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.StringRevertError('TestCallTarget/REVERT'))];
            });
        }); });
        it('AllowanceTarget cannot receive ETH', function () { return __awaiter(_this, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                tx = env.web3Wrapper.sendTransactionAsync({
                    to: allowanceTarget.address,
                    from: owner,
                    value: 0,
                });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.eventually.be.rejected()];
            });
        }); });
    });
});
//# sourceMappingURL=allowance_target_test.js.map