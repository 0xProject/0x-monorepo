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
var artifacts_1 = require("../artifacts");
var wrappers_1 = require("../wrappers");
contracts_test_utils_1.blockchainTests.resets('Transformer (base)', function (env) {
    var deployer;
    var delegateCaller;
    var transformer;
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, env.getAccountAddressesAsync()];
                case 1:
                    _a = __read.apply(void 0, [_b.sent(), 1]), deployer = _a[0];
                    return [4 /*yield*/, wrappers_1.TestDelegateCallerContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestDelegateCaller, env.provider, env.txDefaults, artifacts_1.artifacts)];
                case 2:
                    delegateCaller = _b.sent();
                    return [4 /*yield*/, wrappers_1.TestTransformerBaseContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestTransformerBase, env.provider, __assign({}, env.txDefaults, { from: deployer }), artifacts_1.artifacts)];
                case 3:
                    transformer = _b.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    describe('die()', function () {
        it('cannot be called by non-deployer', function () { return __awaiter(_this, void 0, void 0, function () {
            var notDeployer, tx;
            return __generator(this, function (_a) {
                notDeployer = contracts_test_utils_1.randomAddress();
                tx = transformer.die(contracts_test_utils_1.randomAddress()).callAsync({ from: notDeployer });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.OnlyCallableByDeployerError(notDeployer, deployer))];
            });
        }); });
        it('cannot be called outside of its own context', function () { return __awaiter(_this, void 0, void 0, function () {
            var callData, tx;
            return __generator(this, function (_a) {
                callData = transformer.die(contracts_test_utils_1.randomAddress()).getABIEncodedTransactionData();
                tx = delegateCaller.executeDelegateCall(transformer.address, callData).callAsync({ from: deployer });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.InvalidExecutionContextError(delegateCaller.address, transformer.address))];
            });
        }); });
        it('destroys the transformer', function () { return __awaiter(_this, void 0, void 0, function () {
            var code;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, transformer.die(contracts_test_utils_1.randomAddress()).awaitTransactionSuccessAsync({ from: deployer })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, env.web3Wrapper.getContractCodeAsync(transformer.address)];
                    case 2:
                        code = _a.sent();
                        return [2 /*return*/, contracts_test_utils_1.expect(code).to.eq(contracts_test_utils_1.constants.NULL_BYTES)];
                }
            });
        }); });
    });
});
//# sourceMappingURL=transformer_base_test.js.map