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
contracts_test_utils_1.blockchainTests.resets('TransformerDeployer', function (env) {
    var owner;
    var authority;
    var deployer;
    var deployBytes = artifacts_1.artifacts.TestTransformerDeployerTransformer.compilerOutput.evm.bytecode.object;
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, env.getAccountAddressesAsync()];
                case 1:
                    _a = __read.apply(void 0, [_b.sent(), 2]), owner = _a[0], authority = _a[1];
                    return [4 /*yield*/, wrappers_1.TransformerDeployerContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TransformerDeployer, env.provider, env.txDefaults, artifacts_1.artifacts, [authority])];
                case 2:
                    deployer = _b.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    describe('deploy()', function () {
        it('non-authority cannot call', function () { return __awaiter(_this, void 0, void 0, function () {
            var nonAuthority, tx;
            return __generator(this, function (_a) {
                nonAuthority = contracts_test_utils_1.randomAddress();
                tx = deployer.deploy(deployBytes).callAsync({ from: nonAuthority });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.AuthorizableRevertErrors.SenderNotAuthorizedError(nonAuthority))];
            });
        }); });
        it('authority can deploy', function () { return __awaiter(_this, void 0, void 0, function () {
            var targetAddress, target, receipt, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, deployer.deploy(deployBytes).callAsync({ from: authority })];
                    case 1:
                        targetAddress = _b.sent();
                        target = new wrappers_1.TestTransformerDeployerTransformerContract(targetAddress, env.provider);
                        return [4 /*yield*/, deployer.deploy(deployBytes).awaitTransactionSuccessAsync({ from: authority })];
                    case 2:
                        receipt = _b.sent();
                        _a = contracts_test_utils_1.expect;
                        return [4 /*yield*/, target.deployer().callAsync()];
                    case 3:
                        _a.apply(void 0, [_b.sent()]).to.eq(deployer.address);
                        contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [{ deployedAddress: targetAddress, nonce: new utils_1.BigNumber(1), sender: authority }], wrappers_1.TransformerDeployerEvents.Deployed);
                        return [2 /*return*/];
                }
            });
        }); });
        it('authority can deploy with value', function () { return __awaiter(_this, void 0, void 0, function () {
            var targetAddress, target, receipt, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, deployer.deploy(deployBytes).callAsync({ from: authority, value: 1 })];
                    case 1:
                        targetAddress = _c.sent();
                        target = new wrappers_1.TestTransformerDeployerTransformerContract(targetAddress, env.provider);
                        return [4 /*yield*/, deployer
                                .deploy(deployBytes)
                                .awaitTransactionSuccessAsync({ from: authority, value: 1 })];
                    case 2:
                        receipt = _c.sent();
                        _a = contracts_test_utils_1.expect;
                        return [4 /*yield*/, target.deployer().callAsync()];
                    case 3:
                        _a.apply(void 0, [_c.sent()]).to.eq(deployer.address);
                        contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [{ deployedAddress: targetAddress, nonce: new utils_1.BigNumber(1), sender: authority }], wrappers_1.TransformerDeployerEvents.Deployed);
                        _b = contracts_test_utils_1.expect;
                        return [4 /*yield*/, env.web3Wrapper.getBalanceInWeiAsync(targetAddress)];
                    case 4:
                        _b.apply(void 0, [_c.sent()]).to.bignumber.eq(1);
                        return [2 /*return*/];
                }
            });
        }); });
        it('updates nonce', function () { return __awaiter(_this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = contracts_test_utils_1.expect;
                        return [4 /*yield*/, deployer.nonce().callAsync()];
                    case 1:
                        _a.apply(void 0, [_c.sent()]).to.bignumber.eq(1);
                        return [4 /*yield*/, deployer.deploy(deployBytes).awaitTransactionSuccessAsync({ from: authority })];
                    case 2:
                        _c.sent();
                        _b = contracts_test_utils_1.expect;
                        return [4 /*yield*/, deployer.nonce().callAsync()];
                    case 3:
                        _b.apply(void 0, [_c.sent()]).to.bignumber.eq(2);
                        return [2 /*return*/];
                }
            });
        }); });
        it('nonce can predict deployment address', function () { return __awaiter(_this, void 0, void 0, function () {
            var nonce, targetAddress, target, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, deployer.nonce().callAsync()];
                    case 1:
                        nonce = _b.sent();
                        return [4 /*yield*/, deployer.deploy(deployBytes).callAsync({ from: authority })];
                    case 2:
                        targetAddress = _b.sent();
                        target = new wrappers_1.TestTransformerDeployerTransformerContract(targetAddress, env.provider);
                        return [4 /*yield*/, deployer.deploy(deployBytes).awaitTransactionSuccessAsync({ from: authority })];
                    case 3:
                        _b.sent();
                        _a = contracts_test_utils_1.expect;
                        return [4 /*yield*/, target.isDeployedByDeployer(nonce).callAsync()];
                    case 4:
                        _a.apply(void 0, [_b.sent()]).to.eq(true);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can retrieve deployment nonce from contract address', function () { return __awaiter(_this, void 0, void 0, function () {
            var nonce, targetAddress, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, deployer.nonce().callAsync()];
                    case 1:
                        nonce = _b.sent();
                        return [4 /*yield*/, deployer.deploy(deployBytes).callAsync({ from: authority })];
                    case 2:
                        targetAddress = _b.sent();
                        return [4 /*yield*/, deployer.deploy(deployBytes).awaitTransactionSuccessAsync({ from: authority })];
                    case 3:
                        _b.sent();
                        _a = contracts_test_utils_1.expect;
                        return [4 /*yield*/, deployer.toDeploymentNonce(targetAddress).callAsync()];
                    case 4:
                        _a.apply(void 0, [_b.sent()]).to.bignumber.eq(nonce);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('kill()', function () {
        var target;
        before(function () { return __awaiter(_this, void 0, void 0, function () {
            var targetAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, deployer.deploy(deployBytes).callAsync({ from: authority })];
                    case 1:
                        targetAddress = _a.sent();
                        target = new wrappers_1.TestTransformerDeployerTransformerContract(targetAddress, env.provider);
                        return [4 /*yield*/, deployer.deploy(deployBytes).awaitTransactionSuccessAsync({ from: authority })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('authority cannot call', function () { return __awaiter(_this, void 0, void 0, function () {
            var nonAuthority, tx;
            return __generator(this, function (_a) {
                nonAuthority = contracts_test_utils_1.randomAddress();
                tx = deployer.kill(target.address).callAsync({ from: nonAuthority });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.AuthorizableRevertErrors.SenderNotAuthorizedError(nonAuthority))];
            });
        }); });
        it('authority can kill a contract', function () { return __awaiter(_this, void 0, void 0, function () {
            var receipt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, deployer.kill(target.address).awaitTransactionSuccessAsync({ from: authority })];
                    case 1:
                        receipt = _a.sent();
                        contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [{ target: target.address, sender: authority }], wrappers_1.TransformerDeployerEvents.Killed);
                        return [2 /*return*/, contracts_test_utils_1.expect(env.web3Wrapper.getContractCodeAsync(target.address)).to.become(contracts_test_utils_1.constants.NULL_BYTES)];
                }
            });
        }); });
    });
});
//# sourceMappingURL=transformer_deployer_test.js.map