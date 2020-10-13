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
const _ = require("lodash");
const artifacts_1 = require("./artifacts");
const abis_1 = require("./utils/abis");
const migration_1 = require("./utils/migration");
const wrappers_1 = require("./wrappers");
const { NULL_ADDRESS } = contracts_test_utils_1.constants;
contracts_test_utils_1.blockchainTests.resets('Full migration', env => {
    let owner;
    let zeroEx;
    let features;
    let migrator;
    const transformerDeployer = contracts_test_utils_1.randomAddress();
    before(() => __awaiter(this, void 0, void 0, function* () {
        [owner] = yield env.getAccountAddressesAsync();
        migrator = yield wrappers_1.TestFullMigrationContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestFullMigration, env.provider, env.txDefaults, artifacts_1.artifacts, env.txDefaults.from);
        zeroEx = yield wrappers_1.ZeroExContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.ZeroEx, env.provider, env.txDefaults, artifacts_1.artifacts, yield migrator.getBootstrapper().callAsync());
        features = yield migration_1.deployFullFeaturesAsync(env.provider, env.txDefaults, zeroEx.address);
        yield migrator
            .initializeZeroEx(owner, zeroEx.address, features, { transformerDeployer })
            .awaitTransactionSuccessAsync();
    }));
    it('ZeroEx has the correct owner', () => __awaiter(this, void 0, void 0, function* () {
        const ownable = new wrappers_1.IOwnableFeatureContract(zeroEx.address, env.provider, env.txDefaults);
        const actualOwner = yield ownable.owner().callAsync();
        contracts_test_utils_1.expect(actualOwner).to.eq(owner);
    }));
    it('FullMigration contract self-destructs', () => __awaiter(this, void 0, void 0, function* () {
        const dieRecipient = yield migrator.dieRecipient().callAsync();
        contracts_test_utils_1.expect(dieRecipient).to.eq(owner);
    }));
    it('Non-deployer cannot call initializeZeroEx()', () => __awaiter(this, void 0, void 0, function* () {
        const notDeployer = contracts_test_utils_1.randomAddress();
        const tx = migrator
            .initializeZeroEx(owner, zeroEx.address, features, { transformerDeployer })
            .callAsync({ from: notDeployer });
        return contracts_test_utils_1.expect(tx).to.revertWith('FullMigration/INVALID_SENDER');
    }));
    const FEATURE_FNS = {
        TokenSpender: {
            contractType: wrappers_1.ITokenSpenderFeatureContract,
            fns: ['_spendERC20Tokens'],
        },
        TransformERC20: {
            contractType: wrappers_1.ITransformERC20FeatureContract,
            fns: [
                'transformERC20',
                '_transformERC20',
                'createTransformWallet',
                'getTransformWallet',
                'setTransformerDeployer',
                'getQuoteSigner',
                'setQuoteSigner',
            ],
        },
        SignatureValidator: {
            contractType: wrappers_1.ISignatureValidatorFeatureContract,
            fns: ['isValidHashSignature', 'validateHashSignature'],
        },
        MetaTransactions: {
            contractType: wrappers_1.IMetaTransactionsFeatureContract,
            fns: [
                'executeMetaTransaction',
                'batchExecuteMetaTransactions',
                '_executeMetaTransaction',
                'getMetaTransactionExecutedBlock',
                'getMetaTransactionHashExecutedBlock',
                'getMetaTransactionHash',
            ],
        },
    };
    function createFakeInputs(inputs) {
        if (inputs.length !== undefined) {
            return inputs.map(i => createFakeInputs(i));
        }
        const item = inputs;
        // TODO(dorothy-zbornak): Support fixed-length arrays.
        if (/\[]$/.test(item.type)) {
            return _.times(_.random(0, 8), () => createFakeInputs(Object.assign({}, item, { type: item.type.substring(0, item.type.length - 2) })));
        }
        if (/^tuple$/.test(item.type)) {
            const tuple = {};
            for (const comp of item.components) {
                tuple[comp.name] = createFakeInputs(comp);
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
        throw new Error(`Unhandled input type: '${item.type}'`);
    }
    for (const [featureName, featureInfo] of Object.entries(FEATURE_FNS)) {
        describe(`${featureName} feature`, () => {
            let contract;
            before(() => __awaiter(this, void 0, void 0, function* () {
                contract = new featureInfo.contractType(zeroEx.address, env.provider, env.txDefaults, abis_1.abis);
            }));
            for (const fn of featureInfo.fns) {
                it(`${fn} is registered`, () => __awaiter(this, void 0, void 0, function* () {
                    const selector = contract.getSelector(fn);
                    const impl = yield zeroEx.getFunctionImplementation(selector).callAsync();
                    contracts_test_utils_1.expect(impl).to.not.eq(NULL_ADDRESS);
                }));
                if (fn.startsWith('_')) {
                    it(`${fn} cannot be called from outside`, () => __awaiter(this, void 0, void 0, function* () {
                        const method = contract.abi.find(d => d.type === 'function' && d.name === fn);
                        const inputs = createFakeInputs(method.inputs);
                        const tx = contract[fn](...inputs).callAsync();
                        return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Common.OnlyCallableBySelfError(env.txDefaults.from));
                    }));
                }
            }
        });
    }
    describe("TokenSpender's allowance target", () => {
        let allowanceTarget;
        before(() => __awaiter(this, void 0, void 0, function* () {
            const contract = new wrappers_1.ITokenSpenderFeatureContract(zeroEx.address, env.provider, env.txDefaults);
            allowanceTarget = new wrappers_1.AllowanceTargetContract(yield contract.getAllowanceTarget().callAsync(), env.provider, env.txDefaults);
        }));
        it('is owned by owner', () => __awaiter(this, void 0, void 0, function* () {
            return contracts_test_utils_1.expect(allowanceTarget.owner().callAsync()).to.become(owner);
        }));
        it('Proxy is authorized', () => __awaiter(this, void 0, void 0, function* () {
            return contracts_test_utils_1.expect(allowanceTarget.authorized(zeroEx.address).callAsync()).to.become(true);
        }));
    });
    describe('TransformERC20', () => {
        let feature;
        before(() => __awaiter(this, void 0, void 0, function* () {
            feature = new wrappers_1.ITransformERC20FeatureContract(zeroEx.address, env.provider, env.txDefaults);
        }));
        it('has the correct transformer deployer', () => __awaiter(this, void 0, void 0, function* () {
            return contracts_test_utils_1.expect(feature.getTransformerDeployer().callAsync()).to.become(transformerDeployer);
        }));
    });
});
//# sourceMappingURL=full_migration_test.js.map