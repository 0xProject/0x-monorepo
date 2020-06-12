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
var migration_1 = require("../utils/migration");
var wrappers_1 = require("../wrappers");
contracts_test_utils_1.blockchainTests.resets('Ownable feature', function (env) {
    var notOwner = contracts_test_utils_1.randomAddress();
    var owner;
    var ownable;
    var testMigrator;
    var succeedingMigrateFnCallData;
    var failingMigrateFnCallData;
    var revertingMigrateFnCallData;
    var logDecoder;
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, zeroEx;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, env.getAccountAddressesAsync()];
                case 1:
                    _a = __read.apply(void 0, [_b.sent(), 1]), owner = _a[0];
                    logDecoder = new contracts_test_utils_1.LogDecoder(env.web3Wrapper, artifacts_1.artifacts);
                    return [4 /*yield*/, migration_1.initialMigrateAsync(owner, env.provider, env.txDefaults)];
                case 2:
                    zeroEx = _b.sent();
                    ownable = new wrappers_1.IOwnableContract(zeroEx.address, env.provider, env.txDefaults);
                    return [4 /*yield*/, wrappers_1.TestMigratorContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestMigrator, env.provider, env.txDefaults, artifacts_1.artifacts)];
                case 3:
                    testMigrator = _b.sent();
                    succeedingMigrateFnCallData = testMigrator.succeedingMigrate().getABIEncodedTransactionData();
                    failingMigrateFnCallData = testMigrator.failingMigrate().getABIEncodedTransactionData();
                    revertingMigrateFnCallData = testMigrator.revertingMigrate().getABIEncodedTransactionData();
                    return [2 /*return*/];
            }
        });
    }); });
    describe('transferOwnership()', function () {
        it('non-owner cannot transfer ownership', function () { return __awaiter(_this, void 0, void 0, function () {
            var newOwner, tx;
            return __generator(this, function (_a) {
                newOwner = contracts_test_utils_1.randomAddress();
                tx = ownable.transferOwnership(newOwner).callAsync({ from: notOwner });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.OwnableRevertErrors.OnlyOwnerError(notOwner, owner))];
            });
        }); });
        it('owner can transfer ownership', function () { return __awaiter(_this, void 0, void 0, function () {
            var newOwner, receipt, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        newOwner = contracts_test_utils_1.randomAddress();
                        return [4 /*yield*/, ownable.transferOwnership(newOwner).awaitTransactionSuccessAsync({ from: owner })];
                    case 1:
                        receipt = _b.sent();
                        contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                            {
                                previousOwner: owner,
                                newOwner: newOwner,
                            },
                        ], wrappers_1.IOwnableEvents.OwnershipTransferred);
                        _a = contracts_test_utils_1.expect;
                        return [4 /*yield*/, ownable.owner().callAsync()];
                    case 2:
                        _a.apply(void 0, [_b.sent()]).to.eq(newOwner);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('migrate()', function () {
        var newOwner = contracts_test_utils_1.randomAddress();
        it('non-owner cannot call migrate()', function () { return __awaiter(_this, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                tx = ownable
                    .migrate(testMigrator.address, succeedingMigrateFnCallData, newOwner)
                    .awaitTransactionSuccessAsync({ from: notOwner });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.OwnableRevertErrors.OnlyOwnerError(notOwner, owner))];
            });
        }); });
        it('can successfully execute a migration', function () { return __awaiter(_this, void 0, void 0, function () {
            var receipt, logs, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, ownable
                            .migrate(testMigrator.address, succeedingMigrateFnCallData, newOwner)
                            .awaitTransactionSuccessAsync({ from: owner })];
                    case 1:
                        receipt = _b.sent();
                        logs = logDecoder.decodeReceiptLogs(receipt).logs;
                        contracts_test_utils_1.verifyEventsFromLogs(logs, [
                            {
                                callData: succeedingMigrateFnCallData,
                                owner: ownable.address,
                            },
                        ], wrappers_1.TestMigratorEvents.TestMigrateCalled);
                        _a = contracts_test_utils_1.expect;
                        return [4 /*yield*/, ownable.owner().callAsync()];
                    case 2:
                        _a.apply(void 0, [_b.sent()]).to.eq(newOwner);
                        return [2 /*return*/];
                }
            });
        }); });
        it('failing migration reverts', function () { return __awaiter(_this, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                tx = ownable
                    .migrate(testMigrator.address, failingMigrateFnCallData, newOwner)
                    .awaitTransactionSuccessAsync({ from: owner });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Ownable.MigrateCallFailedError(testMigrator.address, utils_1.hexUtils.rightPad('0xdeadbeef')))];
            });
        }); });
        it('reverting migration reverts', function () { return __awaiter(_this, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                tx = ownable
                    .migrate(testMigrator.address, revertingMigrateFnCallData, newOwner)
                    .awaitTransactionSuccessAsync({ from: owner });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Ownable.MigrateCallFailedError(testMigrator.address, new utils_1.StringRevertError('OOPSIE').encode()))];
            });
        }); });
    });
});
//# sourceMappingURL=ownable_test.js.map