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
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var artifacts_1 = require("../artifacts");
var wrappers_1 = require("../wrappers");
function deployBootstrapFeaturesAsync(provider, txDefaults, features) {
    if (features === void 0) { features = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = {};
                    _b = features.registry;
                    if (_b) return [3 /*break*/, 2];
                    return [4 /*yield*/, wrappers_1.SimpleFunctionRegistryContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.SimpleFunctionRegistry, provider, txDefaults, artifacts_1.artifacts)];
                case 1:
                    _b = (_d.sent());
                    _d.label = 2;
                case 2:
                    _a.registry = _b;
                    _c = features.ownable;
                    if (_c) return [3 /*break*/, 4];
                    return [4 /*yield*/, wrappers_1.OwnableContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.Ownable, provider, txDefaults, artifacts_1.artifacts)];
                case 3:
                    _c = (_d.sent());
                    _d.label = 4;
                case 4: return [2 /*return*/, (_a.ownable = _c,
                        _a)];
            }
        });
    });
}
exports.deployBootstrapFeaturesAsync = deployBootstrapFeaturesAsync;
function initialMigrateAsync(owner, provider, txDefaults, features) {
    if (features === void 0) { features = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var _features, migrator, deployCall, zeroEx, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, deployBootstrapFeaturesAsync(provider, txDefaults, features)];
                case 1:
                    _features = _b.sent();
                    return [4 /*yield*/, wrappers_1.InitialMigrationContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.InitialMigration, provider, txDefaults, artifacts_1.artifacts, txDefaults.from)];
                case 2:
                    migrator = _b.sent();
                    deployCall = migrator.deploy(owner, toFeatureAdddresses(_features));
                    _a = wrappers_1.ZeroExContract.bind;
                    return [4 /*yield*/, deployCall.callAsync()];
                case 3:
                    zeroEx = new (_a.apply(wrappers_1.ZeroExContract, [void 0, _b.sent(), provider, {}]))();
                    return [4 /*yield*/, deployCall.awaitTransactionSuccessAsync()];
                case 4:
                    _b.sent();
                    return [2 /*return*/, zeroEx];
            }
        });
    });
}
exports.initialMigrateAsync = initialMigrateAsync;
function deployFullFeaturesAsync(provider, txDefaults, features) {
    if (features === void 0) { features = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _a = [{}];
                    return [4 /*yield*/, deployBootstrapFeaturesAsync(provider, txDefaults)];
                case 1:
                    _a = _a.concat([(_e.sent())]);
                    _b = {};
                    _c = features.tokenSpender;
                    if (_c) return [3 /*break*/, 3];
                    return [4 /*yield*/, wrappers_1.TokenSpenderContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TokenSpender, provider, txDefaults, artifacts_1.artifacts)];
                case 2:
                    _c = (_e.sent());
                    _e.label = 3;
                case 3:
                    _b.tokenSpender = _c;
                    _d = features.transformERC20;
                    if (_d) return [3 /*break*/, 5];
                    return [4 /*yield*/, wrappers_1.TransformERC20Contract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TransformERC20, provider, txDefaults, artifacts_1.artifacts)];
                case 4:
                    _d = (_e.sent());
                    _e.label = 5;
                case 5: return [2 /*return*/, __assign.apply(void 0, _a.concat([(_b.transformERC20 = _d, _b)]))];
            }
        });
    });
}
exports.deployFullFeaturesAsync = deployFullFeaturesAsync;
function fullMigrateAsync(owner, provider, txDefaults, features, opts) {
    if (features === void 0) { features = {}; }
    if (opts === void 0) { opts = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var _features, migrator, _opts, deployCall, zeroEx, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, deployFullFeaturesAsync(provider, txDefaults, features)];
                case 1:
                    _features = _b.sent();
                    return [4 /*yield*/, wrappers_1.FullMigrationContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.FullMigration, provider, txDefaults, artifacts_1.artifacts, txDefaults.from)];
                case 2:
                    migrator = _b.sent();
                    _opts = __assign({ transformerDeployer: txDefaults.from }, opts);
                    deployCall = migrator.deploy(owner, toFeatureAdddresses(_features), _opts);
                    _a = wrappers_1.ZeroExContract.bind;
                    return [4 /*yield*/, deployCall.callAsync()];
                case 3:
                    zeroEx = new (_a.apply(wrappers_1.ZeroExContract, [void 0, _b.sent(), provider, {}]))();
                    return [4 /*yield*/, deployCall.awaitTransactionSuccessAsync()];
                case 4:
                    _b.sent();
                    return [2 /*return*/, zeroEx];
            }
        });
    });
}
exports.fullMigrateAsync = fullMigrateAsync;
// tslint:disable:space-before-function-parent one-line
function toFeatureAdddresses(features) {
    // TS can't figure this out.
    return _.mapValues(features, function (c) { return c.address; });
}
exports.toFeatureAdddresses = toFeatureAdddresses;
//# sourceMappingURL=migration.js.map