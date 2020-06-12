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
var utils_1 = require("@0x/utils");
var _ = require("lodash");
var artifacts_1 = require("./artifacts");
var abis_1 = require("./utils/abis");
var migration_1 = require("./utils/migration");
var wrappers_1 = require("./wrappers");
var NULL_ADDRESS = contracts_test_utils_1.constants.NULL_ADDRESS;
contracts_test_utils_1.blockchainTests.resets('Full migration', function (env) {
    var e_1, _a;
    var owner;
    var zeroEx;
    var features;
    var migrator;
    var transformerDeployer = contracts_test_utils_1.randomAddress();
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, deployCall, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, env.getAccountAddressesAsync()];
                case 1:
                    _a = __read.apply(void 0, [_c.sent(), 1]), owner = _a[0];
                    return [4 /*yield*/, migration_1.deployFullFeaturesAsync(env.provider, env.txDefaults)];
                case 2:
                    features = _c.sent();
                    return [4 /*yield*/, wrappers_1.TestFullMigrationContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestFullMigration, env.provider, env.txDefaults, artifacts_1.artifacts, env.txDefaults.from)];
                case 3:
                    migrator = _c.sent();
                    deployCall = migrator.deploy(owner, migration_1.toFeatureAdddresses(features), { transformerDeployer: transformerDeployer });
                    _b = wrappers_1.ZeroExContract.bind;
                    return [4 /*yield*/, deployCall.callAsync()];
                case 4:
                    zeroEx = new (_b.apply(wrappers_1.ZeroExContract, [void 0, _c.sent(), env.provider, env.txDefaults]))();
                    return [4 /*yield*/, deployCall.awaitTransactionSuccessAsync()];
                case 5:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('ZeroEx has the correct owner', function () { return __awaiter(_this, void 0, void 0, function () {
        var ownable, actualOwner;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ownable = new wrappers_1.IOwnableContract(zeroEx.address, env.provider, env.txDefaults);
                    return [4 /*yield*/, ownable.owner().callAsync()];
                case 1:
                    actualOwner = _a.sent();
                    contracts_test_utils_1.expect(actualOwner).to.eq(owner);
                    return [2 /*return*/];
            }
        });
    }); });
    it('FullMigration contract self-destructs', function () { return __awaiter(_this, void 0, void 0, function () {
        var dieRecipient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, migrator.dieRecipient().callAsync()];
                case 1:
                    dieRecipient = _a.sent();
                    contracts_test_utils_1.expect(dieRecipient).to.eq(owner);
                    return [2 /*return*/];
            }
        });
    }); });
    it('Non-deployer cannot call deploy()', function () { return __awaiter(_this, void 0, void 0, function () {
        var notDeployer, tx;
        return __generator(this, function (_a) {
            notDeployer = contracts_test_utils_1.randomAddress();
            tx = migrator
                .deploy(owner, migration_1.toFeatureAdddresses(features), { transformerDeployer: transformerDeployer })
                .callAsync({ from: notDeployer });
            return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith('FullMigration/INVALID_SENDER')];
        });
    }); });
    var FEATURE_FNS = {
        TokenSpender: {
            contractType: wrappers_1.ITokenSpenderContract,
            fns: ['_spendERC20Tokens'],
        },
        TransformERC20: {
            contractType: wrappers_1.ITransformERC20Contract,
            fns: [
                'transformERC20',
                '_transformERC20',
                'createTransformWallet',
                'getTransformWallet',
                'setTransformerDeployer',
            ],
        },
    };
    function createFakeInputs(inputs) {
        var e_2, _a;
        if (inputs.length !== undefined) {
            return inputs.map(function (i) { return createFakeInputs(i); });
        }
        var item = inputs;
        // TODO(dorothy-zbornak): Support fixed-length arrays.
        if (/\[]$/.test(item.type)) {
            return _.times(_.random(0, 8), function () {
                return createFakeInputs(__assign({}, item, { type: item.type.substring(0, item.type.length - 2) }));
            });
        }
        if (/^tuple$/.test(item.type)) {
            var tuple = {};
            try {
                for (var _b = __values(item.components), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var comp = _c.value;
                    tuple[comp.name] = createFakeInputs(comp);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return tuple;
        }
        if (item.type === 'address') {
            return contracts_test_utils_1.randomAddress();
        }
        if (item.type === 'byte') {
            return utils_1.hexUtils.random(1);
        }
        if (/^bytes$/.test(item.type)) {
            return utils_1.hexUtils.random(_.random(0, 128));
        }
        if (/^bytes\d+$/.test(item.type)) {
            return utils_1.hexUtils.random(parseInt(/\d+$/.exec(item.type)[0], 10));
        }
        if (/^uint\d+$/.test(item.type)) {
            return new utils_1.BigNumber(utils_1.hexUtils.random(parseInt(/\d+$/.exec(item.type)[0], 10) / 8));
        }
        if (/^int\d+$/.test(item.type)) {
            return new utils_1.BigNumber(utils_1.hexUtils.random(parseInt(/\d+$/.exec(item.type)[0], 10) / 8))
                .div(2)
                .times(_.sample([-1, 1]));
        }
        throw new Error("Unhandled input type: '" + item.type + "'");
    }
    var _loop_1 = function (featureName, featureInfo) {
        describe(featureName + " feature", function () {
            var e_3, _a;
            var contract;
            before(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    contract = new featureInfo.contractType(zeroEx.address, env.provider, env.txDefaults, abis_1.abis);
                    return [2 /*return*/];
                });
            }); });
            var _loop_2 = function (fn) {
                it(fn + " is registered", function () { return __awaiter(_this, void 0, void 0, function () {
                    var selector, impl;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                selector = contract.getSelector(fn);
                                return [4 /*yield*/, zeroEx.getFunctionImplementation(selector).callAsync()];
                            case 1:
                                impl = _a.sent();
                                contracts_test_utils_1.expect(impl).to.not.eq(NULL_ADDRESS);
                                return [2 /*return*/];
                        }
                    });
                }); });
                if (fn.startsWith('_')) {
                    it(fn + " cannot be called from outside", function () { return __awaiter(_this, void 0, void 0, function () {
                        var _a, method, inputs, tx;
                        return __generator(this, function (_b) {
                            method = contract.abi.find(function (d) { return d.type === 'function' && d.name === fn; });
                            inputs = createFakeInputs(method.inputs);
                            tx = (_a = contract)[fn].apply(_a, __spread(inputs)).callAsync();
                            return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Common.OnlyCallableBySelfError(env.txDefaults.from))];
                        });
                    }); });
                }
            };
            try {
                for (var _b = __values(featureInfo.fns), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var fn = _c.value;
                    _loop_2(fn);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_3) throw e_3.error; }
            }
        });
    };
    try {
        for (var _b = __values(Object.entries(FEATURE_FNS)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), featureName = _d[0], featureInfo = _d[1];
            _loop_1(featureName, featureInfo);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    describe("TokenSpender's allowance target", function () {
        var allowanceTarget;
        before(function () { return __awaiter(_this, void 0, void 0, function () {
            var contract, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        contract = new wrappers_1.ITokenSpenderContract(zeroEx.address, env.provider, env.txDefaults);
                        _a = wrappers_1.AllowanceTargetContract.bind;
                        return [4 /*yield*/, contract.getAllowanceTarget().callAsync()];
                    case 1:
                        allowanceTarget = new (_a.apply(wrappers_1.AllowanceTargetContract, [void 0, _b.sent(),
                            env.provider,
                            env.txDefaults]))();
                        return [2 /*return*/];
                }
            });
        }); });
        it('is owned by owner', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, contracts_test_utils_1.expect(allowanceTarget.owner().callAsync()).to.become(owner)];
            });
        }); });
        it('Proxy is authorized', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, contracts_test_utils_1.expect(allowanceTarget.authorized(zeroEx.address).callAsync()).to.become(true)];
            });
        }); });
    });
    describe('TransformERC20', function () {
        var feature;
        before(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                feature = new wrappers_1.ITransformERC20Contract(zeroEx.address, env.provider, env.txDefaults);
                return [2 /*return*/];
            });
        }); });
        it('has the correct transformer deployer', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, contracts_test_utils_1.expect(feature.getTransformerDeployer().callAsync()).to.become(transformerDeployer)];
            });
        }); });
    });
});
//# sourceMappingURL=full_migration_test.js.map