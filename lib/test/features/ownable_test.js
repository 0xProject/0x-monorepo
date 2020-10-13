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
contracts_test_utils_1.blockchainTests.resets('Ownable feature', env => {
    const notOwner = contracts_test_utils_1.randomAddress();
    let owner;
    let ownable;
    let testMigrator;
    let succeedingMigrateFnCallData;
    let failingMigrateFnCallData;
    let revertingMigrateFnCallData;
    let logDecoder;
    before(() => __awaiter(this, void 0, void 0, function* () {
        [owner] = yield env.getAccountAddressesAsync();
        logDecoder = new contracts_test_utils_1.LogDecoder(env.web3Wrapper, artifacts_1.artifacts);
        const zeroEx = yield migration_1.initialMigrateAsync(owner, env.provider, env.txDefaults);
        ownable = new wrappers_1.IOwnableFeatureContract(zeroEx.address, env.provider, env.txDefaults);
        testMigrator = yield wrappers_1.TestMigratorContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestMigrator, env.provider, env.txDefaults, artifacts_1.artifacts);
        succeedingMigrateFnCallData = testMigrator.succeedingMigrate().getABIEncodedTransactionData();
        failingMigrateFnCallData = testMigrator.failingMigrate().getABIEncodedTransactionData();
        revertingMigrateFnCallData = testMigrator.revertingMigrate().getABIEncodedTransactionData();
    }));
    describe('transferOwnership()', () => {
        it('non-owner cannot transfer ownership', () => __awaiter(this, void 0, void 0, function* () {
            const newOwner = contracts_test_utils_1.randomAddress();
            const tx = ownable.transferOwnership(newOwner).callAsync({ from: notOwner });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
        }));
        it('owner can transfer ownership', () => __awaiter(this, void 0, void 0, function* () {
            const newOwner = contracts_test_utils_1.randomAddress();
            const receipt = yield ownable.transferOwnership(newOwner).awaitTransactionSuccessAsync({ from: owner });
            contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                {
                    previousOwner: owner,
                    newOwner,
                },
            ], wrappers_1.IOwnableFeatureEvents.OwnershipTransferred);
            contracts_test_utils_1.expect(yield ownable.owner().callAsync()).to.eq(newOwner);
        }));
    });
    describe('migrate()', () => {
        const newOwner = contracts_test_utils_1.randomAddress();
        it('non-owner cannot call migrate()', () => __awaiter(this, void 0, void 0, function* () {
            const tx = ownable
                .migrate(testMigrator.address, succeedingMigrateFnCallData, newOwner)
                .awaitTransactionSuccessAsync({ from: notOwner });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
        }));
        it('can successfully execute a migration', () => __awaiter(this, void 0, void 0, function* () {
            const receipt = yield ownable
                .migrate(testMigrator.address, succeedingMigrateFnCallData, newOwner)
                .awaitTransactionSuccessAsync({ from: owner });
            const { logs } = logDecoder.decodeReceiptLogs(receipt);
            contracts_test_utils_1.verifyEventsFromLogs(logs, [
                {
                    callData: succeedingMigrateFnCallData,
                    owner: ownable.address,
                },
            ], wrappers_1.TestMigratorEvents.TestMigrateCalled);
            contracts_test_utils_1.expect(yield ownable.owner().callAsync()).to.eq(newOwner);
        }));
        it('failing migration reverts', () => __awaiter(this, void 0, void 0, function* () {
            const tx = ownable
                .migrate(testMigrator.address, failingMigrateFnCallData, newOwner)
                .awaitTransactionSuccessAsync({ from: owner });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Ownable.MigrateCallFailedError(testMigrator.address, utils_1.hexUtils.rightPad('0xdeadbeef')));
        }));
        it('reverting migration reverts', () => __awaiter(this, void 0, void 0, function* () {
            const tx = ownable
                .migrate(testMigrator.address, revertingMigrateFnCallData, newOwner)
                .awaitTransactionSuccessAsync({ from: owner });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Ownable.MigrateCallFailedError(testMigrator.address, new utils_1.StringRevertError('OOPSIE').encode()));
        }));
    });
});
//# sourceMappingURL=ownable_test.js.map