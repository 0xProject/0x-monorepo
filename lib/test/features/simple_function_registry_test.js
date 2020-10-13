"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const utils_1 = require("@0x/utils");
const artifacts_1 = require("../artifacts");
const migration_1 = require("../utils/migration");
const wrappers_1 = require("../wrappers");
contracts_test_utils_1.blockchainTests.resets('SimpleFunctionRegistry feature', env => {
    const { NULL_ADDRESS } = contracts_test_utils_1.constants;
    const notOwner = contracts_test_utils_1.randomAddress();
    let owner;
    let zeroEx;
    let registry;
    let testFnSelector;
    let testFeature;
    let testFeatureImpl1;
    let testFeatureImpl2;
    before(() => __awaiter(this, void 0, void 0, function* () {
        [owner] = yield env.getAccountAddressesAsync();
        zeroEx = yield migration_1.initialMigrateAsync(owner, env.provider, env.txDefaults);
        registry = new wrappers_1.ISimpleFunctionRegistryFeatureContract(zeroEx.address, env.provider, Object.assign({}, env.txDefaults, { from: owner }));
        testFeature = new wrappers_1.ITestSimpleFunctionRegistryFeatureContract(zeroEx.address, env.provider, env.txDefaults);
        testFnSelector = testFeature.getSelector('testFn');
        testFeatureImpl1 = yield wrappers_1.TestSimpleFunctionRegistryFeatureImpl1Contract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestSimpleFunctionRegistryFeatureImpl1, env.provider, env.txDefaults, artifacts_1.artifacts);
        testFeatureImpl2 = yield wrappers_1.TestSimpleFunctionRegistryFeatureImpl2Contract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestSimpleFunctionRegistryFeatureImpl2, env.provider, env.txDefaults, artifacts_1.artifacts);
    }));
    it('`extend()` cannot be called by a non-owner', () => __awaiter(this, void 0, void 0, function* () {
        const tx = registry.extend(utils_1.hexUtils.random(4), contracts_test_utils_1.randomAddress()).callAsync({ from: notOwner });
        return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
    }));
    it('`rollback()` cannot be called by a non-owner', () => __awaiter(this, void 0, void 0, function* () {
        const tx = registry.rollback(utils_1.hexUtils.random(4), NULL_ADDRESS).callAsync({ from: notOwner });
        return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
    }));
    it('`rollback()` to non-zero impl reverts for unregistered function', () => __awaiter(this, void 0, void 0, function* () {
        const rollbackAddress = contracts_test_utils_1.randomAddress();
        const tx = registry.rollback(testFnSelector, rollbackAddress).awaitTransactionSuccessAsync();
        return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.SimpleFunctionRegistry.NotInRollbackHistoryError(testFnSelector, rollbackAddress));
    }));
    it('`rollback()` to zero impl succeeds for unregistered function', () => __awaiter(this, void 0, void 0, function* () {
        yield registry.rollback(testFnSelector, NULL_ADDRESS).awaitTransactionSuccessAsync();
        const impl = yield zeroEx.getFunctionImplementation(testFnSelector).callAsync();
        contracts_test_utils_1.expect(impl).to.eq(NULL_ADDRESS);
    }));
    it('owner can add a new function with `extend()`', () => __awaiter(this, void 0, void 0, function* () {
        const { logs } = yield registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        contracts_test_utils_1.verifyEventsFromLogs(logs, [{ selector: testFnSelector, oldImpl: NULL_ADDRESS, newImpl: testFeatureImpl1.address }], wrappers_1.ISimpleFunctionRegistryFeatureEvents.ProxyFunctionUpdated);
        const r = yield testFeature.testFn().callAsync();
        contracts_test_utils_1.expect(r).to.bignumber.eq(1337);
    }));
    it('owner can replace add a function with `extend()`', () => __awaiter(this, void 0, void 0, function* () {
        yield registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        yield registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync();
        const r = yield testFeature.testFn().callAsync();
        contracts_test_utils_1.expect(r).to.bignumber.eq(1338);
    }));
    it('owner can zero a function with `extend()`', () => __awaiter(this, void 0, void 0, function* () {
        yield registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        yield registry.extend(testFnSelector, contracts_test_utils_1.constants.NULL_ADDRESS).awaitTransactionSuccessAsync();
        return contracts_test_utils_1.expect(testFeature.testFn().callAsync()).to.revertWith(new utils_1.ZeroExRevertErrors.Proxy.NotImplementedError(testFnSelector));
    }));
    it('can query rollback history', () => __awaiter(this, void 0, void 0, function* () {
        yield registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        yield registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync();
        yield registry.extend(testFnSelector, NULL_ADDRESS).awaitTransactionSuccessAsync();
        const rollbackLength = yield registry.getRollbackLength(testFnSelector).callAsync();
        contracts_test_utils_1.expect(rollbackLength).to.bignumber.eq(3);
        const entries = yield Promise.all([...new Array(rollbackLength.toNumber())].map((v, i) => registry.getRollbackEntryAtIndex(testFnSelector, new utils_1.BigNumber(i)).callAsync()));
        contracts_test_utils_1.expect(entries).to.deep.eq([NULL_ADDRESS, testFeatureImpl1.address, testFeatureImpl2.address]);
    }));
    it('owner can rollback a function to zero', () => __awaiter(this, void 0, void 0, function* () {
        yield registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        yield registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync();
        const { logs } = yield registry.rollback(testFnSelector, NULL_ADDRESS).awaitTransactionSuccessAsync();
        contracts_test_utils_1.verifyEventsFromLogs(logs, [{ selector: testFnSelector, oldImpl: testFeatureImpl2.address, newImpl: NULL_ADDRESS }], wrappers_1.ISimpleFunctionRegistryFeatureEvents.ProxyFunctionUpdated);
        const rollbackLength = yield registry.getRollbackLength(testFnSelector).callAsync();
        contracts_test_utils_1.expect(rollbackLength).to.bignumber.eq(0);
        return contracts_test_utils_1.expect(testFeature.testFn().callAsync()).to.revertWith(new utils_1.ZeroExRevertErrors.Proxy.NotImplementedError(testFnSelector));
    }));
    it('owner can rollback a function to the prior version', () => __awaiter(this, void 0, void 0, function* () {
        yield registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        yield registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync();
        yield registry.rollback(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        const r = yield testFeature.testFn().callAsync();
        contracts_test_utils_1.expect(r).to.bignumber.eq(1337);
        const rollbackLength = yield registry.getRollbackLength(testFnSelector).callAsync();
        contracts_test_utils_1.expect(rollbackLength).to.bignumber.eq(1);
    }));
    it('owner can rollback a zero function to the prior version', () => __awaiter(this, void 0, void 0, function* () {
        yield registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync();
        yield registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        yield registry.extend(testFnSelector, contracts_test_utils_1.constants.NULL_ADDRESS).awaitTransactionSuccessAsync();
        yield registry.rollback(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        const r = yield testFeature.testFn().callAsync();
        contracts_test_utils_1.expect(r).to.bignumber.eq(1337);
        const rollbackLength = yield registry.getRollbackLength(testFnSelector).callAsync();
        contracts_test_utils_1.expect(rollbackLength).to.bignumber.eq(2);
    }));
    it('owner can rollback a function to a much older version', () => __awaiter(this, void 0, void 0, function* () {
        yield registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        yield registry.extend(testFnSelector, NULL_ADDRESS).awaitTransactionSuccessAsync();
        yield registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync();
        yield registry.rollback(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        const r = yield testFeature.testFn().callAsync();
        contracts_test_utils_1.expect(r).to.bignumber.eq(1337);
        const rollbackLength = yield registry.getRollbackLength(testFnSelector).callAsync();
        contracts_test_utils_1.expect(rollbackLength).to.bignumber.eq(1);
    }));
    it('owner cannot rollback a function to a version not in history', () => __awaiter(this, void 0, void 0, function* () {
        yield registry.extend(testFnSelector, NULL_ADDRESS).awaitTransactionSuccessAsync();
        yield registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync();
        const tx = registry.rollback(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.SimpleFunctionRegistry.NotInRollbackHistoryError(testFnSelector, testFeatureImpl1.address));
    }));
});
//# sourceMappingURL=simple_function_registry_test.js.map