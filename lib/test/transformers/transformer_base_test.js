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
const wrappers_1 = require("../wrappers");
contracts_test_utils_1.blockchainTests.resets('Transformer (base)', env => {
    let deployer;
    let delegateCaller;
    let transformer;
    before(() => __awaiter(this, void 0, void 0, function* () {
        [deployer] = yield env.getAccountAddressesAsync();
        delegateCaller = yield wrappers_1.TestDelegateCallerContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestDelegateCaller, env.provider, env.txDefaults, artifacts_1.artifacts);
        transformer = yield wrappers_1.TestTransformerBaseContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestTransformerBase, env.provider, Object.assign({}, env.txDefaults, { from: deployer }), artifacts_1.artifacts);
    }));
    describe('die()', () => {
        it('cannot be called by non-deployer', () => __awaiter(this, void 0, void 0, function* () {
            const notDeployer = contracts_test_utils_1.randomAddress();
            const tx = transformer.die(contracts_test_utils_1.randomAddress()).callAsync({ from: notDeployer });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.OnlyCallableByDeployerError(notDeployer, deployer));
        }));
        it('cannot be called outside of its own context', () => __awaiter(this, void 0, void 0, function* () {
            const callData = transformer.die(contracts_test_utils_1.randomAddress()).getABIEncodedTransactionData();
            const tx = delegateCaller.executeDelegateCall(transformer.address, callData).callAsync({ from: deployer });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.InvalidExecutionContextError(delegateCaller.address, transformer.address));
        }));
        it('destroys the transformer', () => __awaiter(this, void 0, void 0, function* () {
            yield transformer.die(contracts_test_utils_1.randomAddress()).awaitTransactionSuccessAsync({ from: deployer });
            const code = yield env.web3Wrapper.getContractCodeAsync(transformer.address);
            return contracts_test_utils_1.expect(code).to.eq(contracts_test_utils_1.constants.NULL_BYTES);
        }));
    });
});
//# sourceMappingURL=transformer_base_test.js.map