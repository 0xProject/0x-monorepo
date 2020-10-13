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
const wrappers_1 = require("./wrappers");
contracts_test_utils_1.blockchainTests.resets('TransformerDeployer', env => {
    let owner;
    let authority;
    let deployer;
    const deployBytes = artifacts_1.artifacts.TestTransformerDeployerTransformer.compilerOutput.evm.bytecode.object;
    before(() => __awaiter(this, void 0, void 0, function* () {
        [owner, authority] = yield env.getAccountAddressesAsync();
        deployer = yield wrappers_1.TransformerDeployerContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TransformerDeployer, env.provider, env.txDefaults, artifacts_1.artifacts, [authority]);
    }));
    describe('deploy()', () => {
        it('non-authority cannot call', () => __awaiter(this, void 0, void 0, function* () {
            const nonAuthority = contracts_test_utils_1.randomAddress();
            const tx = deployer.deploy(deployBytes).callAsync({ from: nonAuthority });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.AuthorizableRevertErrors.SenderNotAuthorizedError(nonAuthority));
        }));
        it('authority can deploy', () => __awaiter(this, void 0, void 0, function* () {
            const targetAddress = yield deployer.deploy(deployBytes).callAsync({ from: authority });
            const target = new wrappers_1.TestTransformerDeployerTransformerContract(targetAddress, env.provider);
            const receipt = yield deployer.deploy(deployBytes).awaitTransactionSuccessAsync({ from: authority });
            contracts_test_utils_1.expect(yield target.deployer().callAsync()).to.eq(deployer.address);
            contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [{ deployedAddress: targetAddress, nonce: new utils_1.BigNumber(1), sender: authority }], wrappers_1.TransformerDeployerEvents.Deployed);
        }));
        it('authority can deploy with value', () => __awaiter(this, void 0, void 0, function* () {
            const targetAddress = yield deployer.deploy(deployBytes).callAsync({ from: authority, value: 1 });
            const target = new wrappers_1.TestTransformerDeployerTransformerContract(targetAddress, env.provider);
            const receipt = yield deployer
                .deploy(deployBytes)
                .awaitTransactionSuccessAsync({ from: authority, value: 1 });
            contracts_test_utils_1.expect(yield target.deployer().callAsync()).to.eq(deployer.address);
            contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [{ deployedAddress: targetAddress, nonce: new utils_1.BigNumber(1), sender: authority }], wrappers_1.TransformerDeployerEvents.Deployed);
            contracts_test_utils_1.expect(yield env.web3Wrapper.getBalanceInWeiAsync(targetAddress)).to.bignumber.eq(1);
        }));
        it('reverts if constructor throws', () => __awaiter(this, void 0, void 0, function* () {
            const CONSTRUCTOR_FAIL_VALUE = new utils_1.BigNumber(3333);
            const tx = deployer.deploy(deployBytes).callAsync({ value: CONSTRUCTOR_FAIL_VALUE, from: authority });
            return contracts_test_utils_1.expect(tx).to.revertWith('TransformerDeployer/DEPLOY_FAILED');
        }));
        it('updates nonce', () => __awaiter(this, void 0, void 0, function* () {
            contracts_test_utils_1.expect(yield deployer.nonce().callAsync()).to.bignumber.eq(1);
            yield deployer.deploy(deployBytes).awaitTransactionSuccessAsync({ from: authority });
            contracts_test_utils_1.expect(yield deployer.nonce().callAsync()).to.bignumber.eq(2);
        }));
        it('nonce can predict deployment address', () => __awaiter(this, void 0, void 0, function* () {
            const nonce = yield deployer.nonce().callAsync();
            const targetAddress = yield deployer.deploy(deployBytes).callAsync({ from: authority });
            const target = new wrappers_1.TestTransformerDeployerTransformerContract(targetAddress, env.provider);
            yield deployer.deploy(deployBytes).awaitTransactionSuccessAsync({ from: authority });
            contracts_test_utils_1.expect(yield target.isDeployedByDeployer(nonce).callAsync()).to.eq(true);
        }));
        it('can retrieve deployment nonce from contract address', () => __awaiter(this, void 0, void 0, function* () {
            const nonce = yield deployer.nonce().callAsync();
            const targetAddress = yield deployer.deploy(deployBytes).callAsync({ from: authority });
            yield deployer.deploy(deployBytes).awaitTransactionSuccessAsync({ from: authority });
            contracts_test_utils_1.expect(yield deployer.toDeploymentNonce(targetAddress).callAsync()).to.bignumber.eq(nonce);
        }));
    });
    describe('kill()', () => {
        const ethRecipient = contracts_test_utils_1.randomAddress();
        let target;
        before(() => __awaiter(this, void 0, void 0, function* () {
            const targetAddress = yield deployer.deploy(deployBytes).callAsync({ from: authority });
            target = new wrappers_1.TestTransformerDeployerTransformerContract(targetAddress, env.provider);
            yield deployer.deploy(deployBytes).awaitTransactionSuccessAsync({ from: authority });
        }));
        it('non-authority cannot call', () => __awaiter(this, void 0, void 0, function* () {
            const nonAuthority = contracts_test_utils_1.randomAddress();
            const tx = deployer.kill(target.address, ethRecipient).callAsync({ from: nonAuthority });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.AuthorizableRevertErrors.SenderNotAuthorizedError(nonAuthority));
        }));
        it('authority can kill a contract', () => __awaiter(this, void 0, void 0, function* () {
            const receipt = yield deployer
                .kill(target.address, ethRecipient)
                .awaitTransactionSuccessAsync({ from: authority });
            contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [{ target: target.address, sender: authority }], wrappers_1.TransformerDeployerEvents.Killed);
            return contracts_test_utils_1.expect(env.web3Wrapper.getContractCodeAsync(target.address)).to.become(contracts_test_utils_1.constants.NULL_BYTES);
        }));
    });
});
//# sourceMappingURL=transformer_deployer_test.js.map