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
const artifacts_1 = require("./artifacts");
const migration_1 = require("./utils/migration");
const wrappers_1 = require("./wrappers");
contracts_test_utils_1.blockchainTests.resets('ZeroEx contract', env => {
    let owner;
    let zeroEx;
    let ownable;
    let registry;
    let testFeature;
    before(() => __awaiter(this, void 0, void 0, function* () {
        [owner] = yield env.getAccountAddressesAsync();
        zeroEx = yield migration_1.initialMigrateAsync(owner, env.provider, env.txDefaults);
        ownable = new wrappers_1.IOwnableFeatureContract(zeroEx.address, env.provider, env.txDefaults);
        registry = new wrappers_1.ISimpleFunctionRegistryFeatureContract(zeroEx.address, env.provider, env.txDefaults);
        testFeature = new wrappers_1.TestZeroExFeatureContract(zeroEx.address, env.provider, env.txDefaults);
        // Register test features.
        const testFeatureImpl = yield wrappers_1.TestZeroExFeatureContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestZeroExFeature, env.provider, env.txDefaults, artifacts_1.artifacts);
        for (const fn of ['payableFn', 'notPayableFn', 'internalFn']) {
            yield registry
                .extend(testFeature.getSelector(fn), testFeatureImpl.address)
                .awaitTransactionSuccessAsync({ from: owner });
        }
    }));
    it('can receive ether', () => __awaiter(this, void 0, void 0, function* () {
        const txHash = yield env.web3Wrapper.sendTransactionAsync({
            from: owner,
            to: zeroEx.address,
            data: contracts_test_utils_1.constants.NULL_BYTES,
            value: 1,
        });
        yield env.web3Wrapper.awaitTransactionSuccessAsync(txHash);
    }));
    it('can attach ether to a call', () => __awaiter(this, void 0, void 0, function* () {
        const wei = Math.floor(Math.random() * 100 + 1);
        const receipt = yield testFeature.payableFn().awaitTransactionSuccessAsync({ value: wei });
        contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [{ value: new utils_1.BigNumber(wei) }], wrappers_1.TestZeroExFeatureEvents.PayableFnCalled);
    }));
    it('reverts when attaching ether to a non-payable function', () => __awaiter(this, void 0, void 0, function* () {
        const wei = Math.floor(Math.random() * 100 + 1);
        const tx = testFeature.notPayableFn().awaitTransactionSuccessAsync({ value: wei });
        // This will cause an empty revert.
        return contracts_test_utils_1.expect(tx).to.be.rejectedWith('revert');
    }));
    it('reverts when calling an unimplmented function', () => __awaiter(this, void 0, void 0, function* () {
        const selector = testFeature.getSelector('unimplmentedFn');
        const tx = testFeature.unimplmentedFn().awaitTransactionSuccessAsync();
        return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Proxy.NotImplementedError(selector));
    }));
    it('reverts when calling an internal function', () => __awaiter(this, void 0, void 0, function* () {
        const tx = testFeature.internalFn().awaitTransactionSuccessAsync({ from: owner });
        return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Common.OnlyCallableBySelfError(owner));
    }));
    describe('getFunctionImplementation()', () => {
        it('returns the correct implementations of the initial features', () => __awaiter(this, void 0, void 0, function* () {
            const ownableSelectors = [ownable.getSelector('transferOwnership')];
            const registrySelectors = [
                registry.getSelector('rollback'),
                registry.getSelector('extend'),
            ];
            const selectors = [...ownableSelectors, ...registrySelectors];
            const impls = yield Promise.all(selectors.map(s => zeroEx.getFunctionImplementation(s).callAsync()));
            for (let i = 0; i < impls.length; ++i) {
                const selector = selectors[i];
                const impl = impls[i];
                const feat = new wrappers_1.IFeatureContract(impl, env.provider, env.txDefaults);
                const featName = ownableSelectors.includes(selector) ? 'Ownable' : 'SimpleFunctionRegistry';
                contracts_test_utils_1.expect(yield feat.FEATURE_NAME().callAsync()).to.eq(featName);
            }
        }));
    });
});
//# sourceMappingURL=zero_ex_test.js.map