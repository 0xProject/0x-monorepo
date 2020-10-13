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
const artifacts_1 = require("./artifacts");
const wrappers_1 = require("./wrappers");
/**
 * Deploy the minimum features of the Exchange Proxy.
 */
function deployBootstrapFeaturesAsync(provider, txDefaults, features = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            registry: features.registry ||
                (yield wrappers_1.SimpleFunctionRegistryFeatureContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.SimpleFunctionRegistryFeature, provider, txDefaults, artifacts_1.artifacts)).address,
            ownable: features.ownable ||
                (yield wrappers_1.OwnableFeatureContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.OwnableFeature, provider, txDefaults, artifacts_1.artifacts)).address,
        };
    });
}
exports.deployBootstrapFeaturesAsync = deployBootstrapFeaturesAsync;
/**
 * Migrate an instance of the Exchange proxy with minimum viable features.
 */
function initialMigrateAsync(owner, provider, txDefaults, features = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const migrator = yield wrappers_1.InitialMigrationContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.InitialMigration, provider, txDefaults, artifacts_1.artifacts, txDefaults.from);
        const zeroEx = yield wrappers_1.ZeroExContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.ZeroEx, provider, txDefaults, artifacts_1.artifacts, migrator.address);
        const _features = yield deployBootstrapFeaturesAsync(provider, txDefaults, features);
        yield migrator.initializeZeroEx(owner, zeroEx.address, _features).awaitTransactionSuccessAsync();
        return zeroEx;
    });
}
exports.initialMigrateAsync = initialMigrateAsync;
/**
 * Deploy all the features for a full Exchange Proxy.
 */
function deployFullFeaturesAsync(provider, txDefaults, zeroExAddress, features = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        return Object.assign({}, (yield deployBootstrapFeaturesAsync(provider, txDefaults)), { tokenSpender: features.tokenSpender ||
                (yield wrappers_1.TokenSpenderFeatureContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TokenSpenderFeature, provider, txDefaults, artifacts_1.artifacts)).address, transformERC20: features.transformERC20 ||
                (yield wrappers_1.TransformERC20FeatureContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TransformERC20Feature, provider, txDefaults, artifacts_1.artifacts)).address, signatureValidator: features.signatureValidator ||
                (yield wrappers_1.SignatureValidatorFeatureContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.SignatureValidatorFeature, provider, txDefaults, artifacts_1.artifacts)).address, metaTransactions: features.metaTransactions ||
                (yield wrappers_1.MetaTransactionsFeatureContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.MetaTransactionsFeature, provider, txDefaults, artifacts_1.artifacts, zeroExAddress)).address });
    });
}
exports.deployFullFeaturesAsync = deployFullFeaturesAsync;
/**
 * Deploy a fully featured instance of the Exchange Proxy.
 */
function fullMigrateAsync(owner, provider, txDefaults, features = {}, opts = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const migrator = yield wrappers_1.FullMigrationContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.FullMigration, provider, txDefaults, artifacts_1.artifacts, txDefaults.from);
        const zeroEx = yield wrappers_1.ZeroExContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.ZeroEx, provider, txDefaults, artifacts_1.artifacts, yield migrator.getBootstrapper().callAsync());
        const _features = yield deployFullFeaturesAsync(provider, txDefaults, zeroEx.address, features);
        const _opts = Object.assign({ transformerDeployer: txDefaults.from }, opts);
        yield migrator.initializeZeroEx(owner, zeroEx.address, _features, _opts).awaitTransactionSuccessAsync();
        return new wrappers_1.IZeroExContract(zeroEx.address, provider, txDefaults);
    });
}
exports.fullMigrateAsync = fullMigrateAsync;
//# sourceMappingURL=migration.js.map