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
var migration_1 = require("./utils/migration");
var wrappers_1 = require("./wrappers");
contracts_test_utils_1.blockchainTests.resets('Initial migration', function (env) {
    var owner;
    var zeroEx;
    var migrator;
    var bootstrapFeature;
    var features;
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b, deployCall, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, env.getAccountAddressesAsync()];
                case 1:
                    _a = __read.apply(void 0, [_d.sent(), 1]), owner = _a[0];
                    return [4 /*yield*/, migration_1.deployBootstrapFeaturesAsync(env.provider, env.txDefaults)];
                case 2:
                    features = _d.sent();
                    return [4 /*yield*/, wrappers_1.TestInitialMigrationContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestInitialMigration, env.provider, env.txDefaults, artifacts_1.artifacts, env.txDefaults.from)];
                case 3:
                    migrator = _d.sent();
                    _b = wrappers_1.IBootstrapContract.bind;
                    return [4 /*yield*/, migrator.bootstrapFeature().callAsync()];
                case 4:
                    bootstrapFeature = new (_b.apply(wrappers_1.IBootstrapContract, [void 0, _d.sent(),
                        env.provider,
                        env.txDefaults,
                        {}]))();
                    deployCall = migrator.deploy(owner, migration_1.toFeatureAdddresses(features));
                    _c = wrappers_1.ZeroExContract.bind;
                    return [4 /*yield*/, deployCall.callAsync()];
                case 5:
                    zeroEx = new (_c.apply(wrappers_1.ZeroExContract, [void 0, _d.sent(), env.provider, env.txDefaults]))();
                    return [4 /*yield*/, deployCall.awaitTransactionSuccessAsync()];
                case 6:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('Self-destructs after deployment', function () { return __awaiter(_this, void 0, void 0, function () {
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
            tx = migrator.deploy(owner, migration_1.toFeatureAdddresses(features)).callAsync({ from: notDeployer });
            return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith('InitialMigration/INVALID_SENDER')];
        });
    }); });
    it('External contract cannot call die()', function () { return __awaiter(_this, void 0, void 0, function () {
        var _migrator, tx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, wrappers_1.InitialMigrationContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.InitialMigration, env.provider, env.txDefaults, artifacts_1.artifacts, env.txDefaults.from)];
                case 1:
                    _migrator = _a.sent();
                    tx = _migrator.die(owner).callAsync();
                    return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith('InitialMigration/INVALID_SENDER')];
            }
        });
    }); });
    describe('bootstrapping', function () {
        it('Migrator cannot call bootstrap() again', function () { return __awaiter(_this, void 0, void 0, function () {
            var tx, selector;
            return __generator(this, function (_a) {
                tx = migrator.callBootstrap(zeroEx.address).awaitTransactionSuccessAsync();
                selector = bootstrapFeature.getSelector('bootstrap');
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Proxy.NotImplementedError(selector))];
            });
        }); });
        it('Bootstrap feature self destructs after deployment', function () { return __awaiter(_this, void 0, void 0, function () {
            var doesExist;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, env.web3Wrapper.doesContractExistAtAddressAsync(bootstrapFeature.address)];
                    case 1:
                        doesExist = _a.sent();
                        contracts_test_utils_1.expect(doesExist).to.eq(false);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('Ownable feature', function () {
        var ownable;
        before(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                ownable = new wrappers_1.IOwnableContract(zeroEx.address, env.provider, env.txDefaults);
                return [2 /*return*/];
            });
        }); });
        it('has the correct owner', function () { return __awaiter(_this, void 0, void 0, function () {
            var actualOwner;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, ownable.owner().callAsync()];
                    case 1:
                        actualOwner = _a.sent();
                        contracts_test_utils_1.expect(actualOwner).to.eq(owner);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('SimpleFunctionRegistry feature', function () {
        var registry;
        before(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                registry = new wrappers_1.SimpleFunctionRegistryContract(zeroEx.address, env.provider, env.txDefaults);
                return [2 /*return*/];
            });
        }); });
        it('_extendSelf() is deregistered', function () { return __awaiter(_this, void 0, void 0, function () {
            var selector, tx;
            return __generator(this, function (_a) {
                selector = registry.getSelector('_extendSelf');
                tx = registry._extendSelf(utils_1.hexUtils.random(4), contracts_test_utils_1.randomAddress()).callAsync({ from: zeroEx.address });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Proxy.NotImplementedError(selector))];
            });
        }); });
    });
});
//# sourceMappingURL=initial_migration_test.js.map