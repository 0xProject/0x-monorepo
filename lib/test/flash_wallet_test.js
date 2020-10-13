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
contracts_test_utils_1.blockchainTests.resets('FlashWallet', env => {
    let owner;
    let wallet;
    let callTarget;
    before(() => __awaiter(this, void 0, void 0, function* () {
        [owner] = yield env.getAccountAddressesAsync();
        wallet = yield wrappers_1.FlashWalletContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.FlashWallet, env.provider, Object.assign({}, env.txDefaults, { from: owner }), artifacts_1.artifacts);
        callTarget = yield wrappers_1.TestCallTargetContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestCallTarget, env.provider, env.txDefaults, artifacts_1.artifacts);
    }));
    const TARGET_RETURN_VALUE = utils_1.hexUtils.rightPad('0x12345678');
    const REVERTING_DATA = '0x1337';
    it('owned by deployer', () => {
        return contracts_test_utils_1.expect(wallet.owner().callAsync()).to.eventually.eq(owner);
    });
    describe('executeCall()', () => {
        it('non-owner cannot call executeCall()', () => __awaiter(this, void 0, void 0, function* () {
            const notOwner = contracts_test_utils_1.randomAddress();
            const tx = wallet
                .executeCall(contracts_test_utils_1.randomAddress(), utils_1.hexUtils.random(), contracts_test_utils_1.getRandomInteger(0, '100e18'))
                .callAsync({ from: notOwner });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.OwnableRevertErrors.OnlyOwnerError(notOwner));
        }));
        it('owner can call executeCall()', () => __awaiter(this, void 0, void 0, function* () {
            const targetData = utils_1.hexUtils.random(128);
            const receipt = yield wallet
                .executeCall(callTarget.address, targetData, contracts_test_utils_1.constants.ZERO_AMOUNT)
                .awaitTransactionSuccessAsync({ from: owner });
            contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                {
                    context: callTarget.address,
                    sender: wallet.address,
                    data: targetData,
                    value: contracts_test_utils_1.constants.ZERO_AMOUNT,
                },
            ], wrappers_1.TestCallTargetEvents.CallTargetCalled);
        }));
        it('owner can call executeCall() with attached ETH', () => __awaiter(this, void 0, void 0, function* () {
            const targetData = utils_1.hexUtils.random(128);
            const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
            const receipt = yield wallet
                .executeCall(callTarget.address, targetData, callValue)
                .awaitTransactionSuccessAsync({ from: owner, value: callValue });
            contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                {
                    context: callTarget.address,
                    sender: wallet.address,
                    data: targetData,
                    value: callValue,
                },
            ], wrappers_1.TestCallTargetEvents.CallTargetCalled);
        }));
        it('owner can call executeCall() can transfer less ETH than attached', () => __awaiter(this, void 0, void 0, function* () {
            const targetData = utils_1.hexUtils.random(128);
            const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
            const receipt = yield wallet
                .executeCall(callTarget.address, targetData, callValue.minus(1))
                .awaitTransactionSuccessAsync({ from: owner, value: callValue });
            contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                {
                    context: callTarget.address,
                    sender: wallet.address,
                    data: targetData,
                    value: callValue.minus(1),
                },
            ], wrappers_1.TestCallTargetEvents.CallTargetCalled);
        }));
        it('wallet returns call result', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield wallet
                .executeCall(callTarget.address, utils_1.hexUtils.random(128), contracts_test_utils_1.constants.ZERO_AMOUNT)
                .callAsync({ from: owner });
            contracts_test_utils_1.expect(result).to.eq(TARGET_RETURN_VALUE);
        }));
        it('wallet wraps call revert', () => __awaiter(this, void 0, void 0, function* () {
            const tx = wallet
                .executeCall(callTarget.address, REVERTING_DATA, contracts_test_utils_1.constants.ZERO_AMOUNT)
                .callAsync({ from: owner });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Wallet.WalletExecuteCallFailedError(wallet.address, callTarget.address, REVERTING_DATA, contracts_test_utils_1.constants.ZERO_AMOUNT, new utils_1.StringRevertError('TestCallTarget/REVERT')));
        }));
        it('wallet can receive ETH', () => __awaiter(this, void 0, void 0, function* () {
            yield env.web3Wrapper.sendTransactionAsync({
                to: wallet.address,
                from: owner,
                value: 1,
            });
            const bal = yield env.web3Wrapper.getBalanceInWeiAsync(wallet.address);
            contracts_test_utils_1.expect(bal).to.bignumber.eq(1);
        }));
    });
    describe('executeDelegateCall()', () => {
        it('non-owner cannot call executeDelegateCall()', () => __awaiter(this, void 0, void 0, function* () {
            const notOwner = contracts_test_utils_1.randomAddress();
            const tx = wallet.executeDelegateCall(contracts_test_utils_1.randomAddress(), utils_1.hexUtils.random()).callAsync({ from: notOwner });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.OwnableRevertErrors.OnlyOwnerError(notOwner));
        }));
        it('owner can call executeDelegateCall()', () => __awaiter(this, void 0, void 0, function* () {
            const targetData = utils_1.hexUtils.random(128);
            const receipt = yield wallet
                .executeDelegateCall(callTarget.address, targetData)
                .awaitTransactionSuccessAsync({ from: owner });
            contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                {
                    context: wallet.address,
                    sender: owner,
                    data: targetData,
                    value: contracts_test_utils_1.constants.ZERO_AMOUNT,
                },
            ], wrappers_1.TestCallTargetEvents.CallTargetCalled);
        }));
        it('executeDelegateCall() is payable', () => __awaiter(this, void 0, void 0, function* () {
            const targetData = utils_1.hexUtils.random(128);
            const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
            const receipt = yield wallet
                .executeDelegateCall(callTarget.address, targetData)
                .awaitTransactionSuccessAsync({ from: owner, value: callValue });
            contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                {
                    context: wallet.address,
                    sender: owner,
                    data: targetData,
                    value: callValue,
                },
            ], wrappers_1.TestCallTargetEvents.CallTargetCalled);
        }));
        it('wallet returns call result', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield wallet
                .executeDelegateCall(callTarget.address, utils_1.hexUtils.random(128))
                .callAsync({ from: owner });
            contracts_test_utils_1.expect(result).to.eq(TARGET_RETURN_VALUE);
        }));
        it('wallet wraps call revert', () => __awaiter(this, void 0, void 0, function* () {
            const tx = wallet.executeDelegateCall(callTarget.address, REVERTING_DATA).callAsync({ from: owner });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Wallet.WalletExecuteDelegateCallFailedError(wallet.address, callTarget.address, REVERTING_DATA, new utils_1.StringRevertError('TestCallTarget/REVERT')));
        }));
    });
});
//# sourceMappingURL=flash_wallet_test.js.map