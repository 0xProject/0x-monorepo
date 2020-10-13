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
contracts_test_utils_1.blockchainTests.resets('Initial migration', env => {
    let owner;
    let zeroEx;
    let migrator;
    let bootstrapFeature;
    let features;
    before(() => __awaiter(this, void 0, void 0, function* () {
        [owner] = yield env.getAccountAddressesAsync();
        features = yield migration_1.deployBootstrapFeaturesAsync(env.provider, env.txDefaults);
        migrator = yield wrappers_1.TestInitialMigrationContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestInitialMigration, env.provider, env.txDefaults, artifacts_1.artifacts, env.txDefaults.from);
        bootstrapFeature = new wrappers_1.IBootstrapFeatureContract(yield migrator.bootstrapFeature().callAsync(), env.provider, env.txDefaults, {});
        zeroEx = yield wrappers_1.ZeroExContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.ZeroEx, env.provider, env.txDefaults, artifacts_1.artifacts, migrator.address);
        yield migrator.initializeZeroEx(owner, zeroEx.address, features).awaitTransactionSuccessAsync();
    }));
    it('Self-destructs after deployment', () => __awaiter(this, void 0, void 0, function* () {
        const dieRecipient = yield migrator.dieRecipient().callAsync();
        contracts_test_utils_1.expect(dieRecipient).to.eq(owner);
    }));
    it('Non-deployer cannot call initializeZeroEx()', () => __awaiter(this, void 0, void 0, function* () {
        const notDeployer = contracts_test_utils_1.randomAddress();
        const tx = migrator.initializeZeroEx(owner, zeroEx.address, features).callAsync({ from: notDeployer });
        return contracts_test_utils_1.expect(tx).to.revertWith('InitialMigration/INVALID_SENDER');
    }));
    it('External contract cannot call die()', () => __awaiter(this, void 0, void 0, function* () {
        const _migrator = yield wrappers_1.InitialMigrationContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.InitialMigration, env.provider, env.txDefaults, artifacts_1.artifacts, env.txDefaults.from);
        const tx = _migrator.die(owner).callAsync();
        return contracts_test_utils_1.expect(tx).to.revertWith('InitialMigration/INVALID_SENDER');
    }));
    describe('bootstrapping', () => {
        it('Migrator cannot call bootstrap() again', () => __awaiter(this, void 0, void 0, function* () {
            const tx = migrator.callBootstrap(zeroEx.address).awaitTransactionSuccessAsync();
            const selector = bootstrapFeature.getSelector('bootstrap');
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Proxy.NotImplementedError(selector));
        }));
        it('Bootstrap feature self destructs after deployment', () => __awaiter(this, void 0, void 0, function* () {
            const doesExist = yield env.web3Wrapper.doesContractExistAtAddressAsync(bootstrapFeature.address);
            contracts_test_utils_1.expect(doesExist).to.eq(false);
        }));
    });
    describe('Ownable feature', () => {
        let ownable;
        before(() => __awaiter(this, void 0, void 0, function* () {
            ownable = new wrappers_1.IOwnableFeatureContract(zeroEx.address, env.provider, env.txDefaults);
        }));
        it('has the correct owner', () => __awaiter(this, void 0, void 0, function* () {
            const actualOwner = yield ownable.owner().callAsync();
            contracts_test_utils_1.expect(actualOwner).to.eq(owner);
        }));
    });
    describe('SimpleFunctionRegistry feature', () => {
        let registry;
        before(() => __awaiter(this, void 0, void 0, function* () {
            registry = new wrappers_1.SimpleFunctionRegistryFeatureContract(zeroEx.address, env.provider, env.txDefaults);
        }));
        it('_extendSelf() is deregistered', () => __awaiter(this, void 0, void 0, function* () {
            const selector = registry.getSelector('_extendSelf');
            const tx = registry._extendSelf(utils_1.hexUtils.random(4), contracts_test_utils_1.randomAddress()).callAsync({ from: zeroEx.address });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Proxy.NotImplementedError(selector));
        }));
    });
});
//# sourceMappingURL=initial_migration_test.js.map