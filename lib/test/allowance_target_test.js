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
contracts_test_utils_1.blockchainTests.resets('AllowanceTarget', env => {
    let owner;
    let authority;
    let allowanceTarget;
    let callTarget;
    before(() => __awaiter(this, void 0, void 0, function* () {
        [owner, authority] = yield env.getAccountAddressesAsync();
        allowanceTarget = yield wrappers_1.AllowanceTargetContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.AllowanceTarget, env.provider, env.txDefaults, artifacts_1.artifacts);
        yield allowanceTarget.addAuthorizedAddress(authority).awaitTransactionSuccessAsync();
        callTarget = yield wrappers_1.TestCallTargetContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestCallTarget, env.provider, env.txDefaults, artifacts_1.artifacts);
    }));
    const TARGET_RETURN_VALUE = utils_1.hexUtils.rightPad('0x12345678');
    const REVERTING_DATA = '0x1337';
    describe('executeCall()', () => {
        it('non-authority cannot call executeCall()', () => __awaiter(this, void 0, void 0, function* () {
            const notAuthority = contracts_test_utils_1.randomAddress();
            const tx = allowanceTarget
                .executeCall(contracts_test_utils_1.randomAddress(), utils_1.hexUtils.random())
                .callAsync({ from: notAuthority });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthority));
        }));
        it('authority can call executeCall()', () => __awaiter(this, void 0, void 0, function* () {
            const targetData = utils_1.hexUtils.random(128);
            const receipt = yield allowanceTarget
                .executeCall(callTarget.address, targetData)
                .awaitTransactionSuccessAsync({ from: authority });
            contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                {
                    context: callTarget.address,
                    sender: allowanceTarget.address,
                    data: targetData,
                    value: contracts_test_utils_1.constants.ZERO_AMOUNT,
                },
            ], wrappers_1.TestCallTargetEvents.CallTargetCalled);
        }));
        it('AllowanceTarget returns call result', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield allowanceTarget
                .executeCall(callTarget.address, utils_1.hexUtils.random(128))
                .callAsync({ from: authority });
            contracts_test_utils_1.expect(result).to.eq(TARGET_RETURN_VALUE);
        }));
        it('AllowanceTarget returns raw call revert', () => __awaiter(this, void 0, void 0, function* () {
            const tx = allowanceTarget.executeCall(callTarget.address, REVERTING_DATA).callAsync({ from: authority });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.StringRevertError('TestCallTarget/REVERT'));
        }));
        it('AllowanceTarget cannot receive ETH', () => __awaiter(this, void 0, void 0, function* () {
            const tx = env.web3Wrapper.sendTransactionAsync({
                to: allowanceTarget.address,
                from: owner,
                value: 0,
            });
            return contracts_test_utils_1.expect(tx).to.eventually.be.rejected();
        }));
    });
});
//# sourceMappingURL=allowance_target_test.js.map