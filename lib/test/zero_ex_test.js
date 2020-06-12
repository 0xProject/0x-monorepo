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
var utils_1 = require("@0x/utils");
var artifacts_1 = require("./artifacts");
var migration_1 = require("./utils/migration");
var wrappers_1 = require("./wrappers");
contracts_test_utils_1.blockchainTests.resets('ZeroEx contract', function (env) {
    var owner;
    var zeroEx;
    var ownable;
    var registry;
    var testFeature;
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, e_1, _b, testFeatureImpl, _c, _d, fn, e_1_1;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, env.getAccountAddressesAsync()];
                case 1:
                    _a = __read.apply(void 0, [_e.sent(), 1]), owner = _a[0];
                    return [4 /*yield*/, migration_1.initialMigrateAsync(owner, env.provider, env.txDefaults)];
                case 2:
                    zeroEx = _e.sent();
                    ownable = new wrappers_1.IOwnableContract(zeroEx.address, env.provider, env.txDefaults);
                    registry = new wrappers_1.ISimpleFunctionRegistryContract(zeroEx.address, env.provider, env.txDefaults);
                    testFeature = new wrappers_1.TestZeroExFeatureContract(zeroEx.address, env.provider, env.txDefaults);
                    return [4 /*yield*/, wrappers_1.TestZeroExFeatureContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestZeroExFeature, env.provider, env.txDefaults, artifacts_1.artifacts)];
                case 3:
                    testFeatureImpl = _e.sent();
                    _e.label = 4;
                case 4:
                    _e.trys.push([4, 9, 10, 11]);
                    _c = __values(['payableFn', 'notPayableFn', 'internalFn']), _d = _c.next();
                    _e.label = 5;
                case 5:
                    if (!!_d.done) return [3 /*break*/, 8];
                    fn = _d.value;
                    return [4 /*yield*/, registry
                            .extend(testFeature.getSelector(fn), testFeatureImpl.address)
                            .awaitTransactionSuccessAsync({ from: owner })];
                case 6:
                    _e.sent();
                    _e.label = 7;
                case 7:
                    _d = _c.next();
                    return [3 /*break*/, 5];
                case 8: return [3 /*break*/, 11];
                case 9:
                    e_1_1 = _e.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 11];
                case 10:
                    try {
                        if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    }); });
    it('can receive ether', function () { return __awaiter(_this, void 0, void 0, function () {
        var txHash;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, env.web3Wrapper.sendTransactionAsync({
                        from: owner,
                        to: zeroEx.address,
                        data: contracts_test_utils_1.constants.NULL_BYTES,
                        value: 1,
                    })];
                case 1:
                    txHash = _a.sent();
                    return [4 /*yield*/, env.web3Wrapper.awaitTransactionSuccessAsync(txHash)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('can attach ether to a call', function () { return __awaiter(_this, void 0, void 0, function () {
        var wei, receipt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    wei = Math.floor(Math.random() * 100 + 1);
                    return [4 /*yield*/, testFeature.payableFn().awaitTransactionSuccessAsync({ value: wei })];
                case 1:
                    receipt = _a.sent();
                    contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [{ value: new utils_1.BigNumber(wei) }], wrappers_1.TestZeroExFeatureEvents.PayableFnCalled);
                    return [2 /*return*/];
            }
        });
    }); });
    it('reverts when attaching ether to a non-payable function', function () { return __awaiter(_this, void 0, void 0, function () {
        var wei, tx;
        return __generator(this, function (_a) {
            wei = Math.floor(Math.random() * 100 + 1);
            tx = testFeature.notPayableFn().awaitTransactionSuccessAsync({ value: wei });
            // This will cause an empty revert.
            return [2 /*return*/, contracts_test_utils_1.expect(tx).to.be.rejectedWith('revert')];
        });
    }); });
    it('reverts when calling an unimplmented function', function () { return __awaiter(_this, void 0, void 0, function () {
        var selector, tx;
        return __generator(this, function (_a) {
            selector = testFeature.getSelector('unimplmentedFn');
            tx = testFeature.unimplmentedFn().awaitTransactionSuccessAsync();
            return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Proxy.NotImplementedError(selector))];
        });
    }); });
    it('reverts when calling an internal function', function () { return __awaiter(_this, void 0, void 0, function () {
        var tx;
        return __generator(this, function (_a) {
            tx = testFeature.internalFn().awaitTransactionSuccessAsync({ from: owner });
            return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Common.OnlyCallableBySelfError(owner))];
        });
    }); });
    describe('getFunctionImplementation()', function () {
        it('returns the correct implementations of the initial features', function () { return __awaiter(_this, void 0, void 0, function () {
            var ownableSelectors, registrySelectors, selectors, impls, i, selector, impl, feat, featName, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        ownableSelectors = [ownable.getSelector('transferOwnership')];
                        registrySelectors = [
                            registry.getSelector('rollback'),
                            registry.getSelector('extend'),
                        ];
                        selectors = __spread(ownableSelectors, registrySelectors);
                        return [4 /*yield*/, Promise.all(selectors.map(function (s) { return zeroEx.getFunctionImplementation(s).callAsync(); }))];
                    case 1:
                        impls = _b.sent();
                        i = 0;
                        _b.label = 2;
                    case 2:
                        if (!(i < impls.length)) return [3 /*break*/, 5];
                        selector = selectors[i];
                        impl = impls[i];
                        feat = new wrappers_1.IFeatureContract(impl, env.provider, env.txDefaults);
                        featName = ownableSelectors.includes(selector) ? 'Ownable' : 'SimpleFunctionRegistry';
                        _a = contracts_test_utils_1.expect;
                        return [4 /*yield*/, feat.FEATURE_NAME().callAsync()];
                    case 3:
                        _a.apply(void 0, [_b.sent()]).to.eq(featName);
                        _b.label = 4;
                    case 4:
                        ++i;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=zero_ex_test.js.map