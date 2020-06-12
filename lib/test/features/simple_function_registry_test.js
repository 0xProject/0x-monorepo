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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var contracts_test_utils_1 = require("@0x/contracts-test-utils");
var utils_1 = require("@0x/utils");
var artifacts_1 = require("../artifacts");
var migration_1 = require("../utils/migration");
var wrappers_1 = require("../wrappers");
contracts_test_utils_1.blockchainTests.resets('SimpleFunctionRegistry feature', function (env) {
    var NULL_ADDRESS = contracts_test_utils_1.constants.NULL_ADDRESS;
    var notOwner = contracts_test_utils_1.randomAddress();
    var owner;
    var zeroEx;
    var registry;
    var testFnSelector;
    var testFeature;
    var testFeatureImpl1;
    var testFeatureImpl2;
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, env.getAccountAddressesAsync()];
                case 1:
                    _a = __read.apply(void 0, [_b.sent(), 1]), owner = _a[0];
                    return [4 /*yield*/, migration_1.initialMigrateAsync(owner, env.provider, env.txDefaults)];
                case 2:
                    zeroEx = _b.sent();
                    registry = new wrappers_1.ISimpleFunctionRegistryContract(zeroEx.address, env.provider, __assign({}, env.txDefaults, { from: owner }));
                    testFeature = new wrappers_1.ITestSimpleFunctionRegistryFeatureContract(zeroEx.address, env.provider, env.txDefaults);
                    testFnSelector = testFeature.getSelector('testFn');
                    return [4 /*yield*/, wrappers_1.TestSimpleFunctionRegistryFeatureImpl1Contract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestSimpleFunctionRegistryFeatureImpl1, env.provider, env.txDefaults, artifacts_1.artifacts)];
                case 3:
                    testFeatureImpl1 = _b.sent();
                    return [4 /*yield*/, wrappers_1.TestSimpleFunctionRegistryFeatureImpl2Contract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestSimpleFunctionRegistryFeatureImpl2, env.provider, env.txDefaults, artifacts_1.artifacts)];
                case 4:
                    testFeatureImpl2 = _b.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('`extend()` cannot be called by a non-owner', function () { return __awaiter(_this, void 0, void 0, function () {
        var tx;
        return __generator(this, function (_a) {
            tx = registry.extend(utils_1.hexUtils.random(4), contracts_test_utils_1.randomAddress()).callAsync({ from: notOwner });
            return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.OwnableRevertErrors.OnlyOwnerError(notOwner, owner))];
        });
    }); });
    it('`rollback()` cannot be called by a non-owner', function () { return __awaiter(_this, void 0, void 0, function () {
        var tx;
        return __generator(this, function (_a) {
            tx = registry.rollback(utils_1.hexUtils.random(4), NULL_ADDRESS).callAsync({ from: notOwner });
            return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.OwnableRevertErrors.OnlyOwnerError(notOwner, owner))];
        });
    }); });
    it('`rollback()` to non-zero impl reverts for unregistered function', function () { return __awaiter(_this, void 0, void 0, function () {
        var rollbackAddress, tx;
        return __generator(this, function (_a) {
            rollbackAddress = contracts_test_utils_1.randomAddress();
            tx = registry.rollback(testFnSelector, rollbackAddress).awaitTransactionSuccessAsync();
            return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.SimpleFunctionRegistry.NotInRollbackHistoryError(testFnSelector, rollbackAddress))];
        });
    }); });
    it('`rollback()` to zero impl succeeds for unregistered function', function () { return __awaiter(_this, void 0, void 0, function () {
        var impl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, registry.rollback(testFnSelector, NULL_ADDRESS).awaitTransactionSuccessAsync()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, zeroEx.getFunctionImplementation(testFnSelector).callAsync()];
                case 2:
                    impl = _a.sent();
                    contracts_test_utils_1.expect(impl).to.eq(NULL_ADDRESS);
                    return [2 /*return*/];
            }
        });
    }); });
    it('owner can add a new function with `extend()`', function () { return __awaiter(_this, void 0, void 0, function () {
        var logs, r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync()];
                case 1:
                    logs = (_a.sent()).logs;
                    contracts_test_utils_1.verifyEventsFromLogs(logs, [{ selector: testFnSelector, oldImpl: NULL_ADDRESS, newImpl: testFeatureImpl1.address }], wrappers_1.ISimpleFunctionRegistryEvents.ProxyFunctionUpdated);
                    return [4 /*yield*/, testFeature.testFn().callAsync()];
                case 2:
                    r = _a.sent();
                    contracts_test_utils_1.expect(r).to.bignumber.eq(1337);
                    return [2 /*return*/];
            }
        });
    }); });
    it('owner can replace add a function with `extend()`', function () { return __awaiter(_this, void 0, void 0, function () {
        var r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, testFeature.testFn().callAsync()];
                case 3:
                    r = _a.sent();
                    contracts_test_utils_1.expect(r).to.bignumber.eq(1338);
                    return [2 /*return*/];
            }
        });
    }); });
    it('owner can zero a function with `extend()`', function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, registry.extend(testFnSelector, contracts_test_utils_1.constants.NULL_ADDRESS).awaitTransactionSuccessAsync()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, contracts_test_utils_1.expect(testFeature.testFn().callAsync()).to.revertWith(new utils_1.ZeroExRevertErrors.Proxy.NotImplementedError(testFnSelector))];
            }
        });
    }); });
    it('can query rollback history', function () { return __awaiter(_this, void 0, void 0, function () {
        var rollbackLength, entries;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, registry.extend(testFnSelector, NULL_ADDRESS).awaitTransactionSuccessAsync()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, registry.getRollbackLength(testFnSelector).callAsync()];
                case 4:
                    rollbackLength = _a.sent();
                    contracts_test_utils_1.expect(rollbackLength).to.bignumber.eq(3);
                    return [4 /*yield*/, Promise.all(__spread(new Array(rollbackLength.toNumber())).map(function (v, i) {
                            return registry.getRollbackEntryAtIndex(testFnSelector, new utils_1.BigNumber(i)).callAsync();
                        }))];
                case 5:
                    entries = _a.sent();
                    contracts_test_utils_1.expect(entries).to.deep.eq([NULL_ADDRESS, testFeatureImpl1.address, testFeatureImpl2.address]);
                    return [2 /*return*/];
            }
        });
    }); });
    it('owner can rollback a function to zero', function () { return __awaiter(_this, void 0, void 0, function () {
        var logs, rollbackLength;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, registry.rollback(testFnSelector, NULL_ADDRESS).awaitTransactionSuccessAsync()];
                case 3:
                    logs = (_a.sent()).logs;
                    contracts_test_utils_1.verifyEventsFromLogs(logs, [{ selector: testFnSelector, oldImpl: testFeatureImpl2.address, newImpl: NULL_ADDRESS }], wrappers_1.ISimpleFunctionRegistryEvents.ProxyFunctionUpdated);
                    return [4 /*yield*/, registry.getRollbackLength(testFnSelector).callAsync()];
                case 4:
                    rollbackLength = _a.sent();
                    contracts_test_utils_1.expect(rollbackLength).to.bignumber.eq(0);
                    return [2 /*return*/, contracts_test_utils_1.expect(testFeature.testFn().callAsync()).to.revertWith(new utils_1.ZeroExRevertErrors.Proxy.NotImplementedError(testFnSelector))];
            }
        });
    }); });
    it('owner can rollback a function to the prior version', function () { return __awaiter(_this, void 0, void 0, function () {
        var r, rollbackLength;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, registry.rollback(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, testFeature.testFn().callAsync()];
                case 4:
                    r = _a.sent();
                    contracts_test_utils_1.expect(r).to.bignumber.eq(1337);
                    return [4 /*yield*/, registry.getRollbackLength(testFnSelector).callAsync()];
                case 5:
                    rollbackLength = _a.sent();
                    contracts_test_utils_1.expect(rollbackLength).to.bignumber.eq(1);
                    return [2 /*return*/];
            }
        });
    }); });
    it('owner can rollback a zero function to the prior version', function () { return __awaiter(_this, void 0, void 0, function () {
        var r, rollbackLength;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, registry.extend(testFnSelector, contracts_test_utils_1.constants.NULL_ADDRESS).awaitTransactionSuccessAsync()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, registry.rollback(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, testFeature.testFn().callAsync()];
                case 5:
                    r = _a.sent();
                    contracts_test_utils_1.expect(r).to.bignumber.eq(1337);
                    return [4 /*yield*/, registry.getRollbackLength(testFnSelector).callAsync()];
                case 6:
                    rollbackLength = _a.sent();
                    contracts_test_utils_1.expect(rollbackLength).to.bignumber.eq(2);
                    return [2 /*return*/];
            }
        });
    }); });
    it('owner can rollback a function to a much older version', function () { return __awaiter(_this, void 0, void 0, function () {
        var r, rollbackLength;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, registry.extend(testFnSelector, NULL_ADDRESS).awaitTransactionSuccessAsync()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, registry.rollback(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, testFeature.testFn().callAsync()];
                case 5:
                    r = _a.sent();
                    contracts_test_utils_1.expect(r).to.bignumber.eq(1337);
                    return [4 /*yield*/, registry.getRollbackLength(testFnSelector).callAsync()];
                case 6:
                    rollbackLength = _a.sent();
                    contracts_test_utils_1.expect(rollbackLength).to.bignumber.eq(1);
                    return [2 /*return*/];
            }
        });
    }); });
    it('owner cannot rollback a function to a version not in history', function () { return __awaiter(_this, void 0, void 0, function () {
        var tx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, registry.extend(testFnSelector, NULL_ADDRESS).awaitTransactionSuccessAsync()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync()];
                case 2:
                    _a.sent();
                    tx = registry.rollback(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
                    return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.SimpleFunctionRegistry.NotInRollbackHistoryError(testFnSelector, testFeatureImpl1.address))];
            }
        });
    }); });
});
//# sourceMappingURL=simple_function_registry_test.js.map