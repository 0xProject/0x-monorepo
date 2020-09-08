import { blockchainTests, expect, LogDecoder, randomAddress, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { hexUtils, OwnableRevertErrors, StringRevertError, ZeroExRevertErrors } from '@0x/utils';

import { artifacts } from '../artifacts';
import { initialMigrateAsync } from '../utils/migration';
import { IOwnableFeatureContract, IOwnableFeatureEvents, TestMigratorContract, TestMigratorEvents } from '../wrappers';

blockchainTests.resets('Ownable feature', env => {
    const notOwner = randomAddress();
    let owner: string;
    let ownable: IOwnableFeatureContract;
    let testMigrator: TestMigratorContract;
    let succeedingMigrateFnCallData: string;
    let failingMigrateFnCallData: string;
    let revertingMigrateFnCallData: string;
    let logDecoder: LogDecoder;

    before(async () => {
        [owner] = await env.getAccountAddressesAsync();
        logDecoder = new LogDecoder(env.web3Wrapper, artifacts);
        const zeroEx = await initialMigrateAsync(owner, env.provider, env.txDefaults);
        ownable = new IOwnableFeatureContract(zeroEx.address, env.provider, env.txDefaults);
        testMigrator = await TestMigratorContract.deployFrom0xArtifactAsync(
            artifacts.TestMigrator,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        succeedingMigrateFnCallData = testMigrator.succeedingMigrate().getABIEncodedTransactionData();
        failingMigrateFnCallData = testMigrator.failingMigrate().getABIEncodedTransactionData();
        revertingMigrateFnCallData = testMigrator.revertingMigrate().getABIEncodedTransactionData();
    });

    describe('transferOwnership()', () => {
        it('non-owner cannot transfer ownership', async () => {
            const newOwner = randomAddress();
            const tx = ownable.transferOwnership(newOwner).callAsync({ from: notOwner });
            return expect(tx).to.revertWith(new OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
        });

        it('owner can transfer ownership', async () => {
            const newOwner = randomAddress();
            const receipt = await ownable.transferOwnership(newOwner).awaitTransactionSuccessAsync({ from: owner });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        previousOwner: owner,
                        newOwner,
                    },
                ],
                IOwnableFeatureEvents.OwnershipTransferred,
            );
            expect(await ownable.owner().callAsync()).to.eq(newOwner);
        });
    });

    describe('migrate()', () => {
        const newOwner = randomAddress();

        it('non-owner cannot call migrate()', async () => {
            const tx = ownable
                .migrate(testMigrator.address, succeedingMigrateFnCallData, newOwner)
                .awaitTransactionSuccessAsync({ from: notOwner });
            return expect(tx).to.revertWith(new OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
        });

        it('can successfully execute a migration', async () => {
            const receipt = await ownable
                .migrate(testMigrator.address, succeedingMigrateFnCallData, newOwner)
                .awaitTransactionSuccessAsync({ from: owner });
            const { logs } = logDecoder.decodeReceiptLogs(receipt);
            verifyEventsFromLogs(
                logs,
                [
                    {
                        callData: succeedingMigrateFnCallData,
                        owner: ownable.address,
                    },
                ],
                TestMigratorEvents.TestMigrateCalled,
            );
            expect(await ownable.owner().callAsync()).to.eq(newOwner);
        });

        it('failing migration reverts', async () => {
            const tx = ownable
                .migrate(testMigrator.address, failingMigrateFnCallData, newOwner)
                .awaitTransactionSuccessAsync({ from: owner });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.Ownable.MigrateCallFailedError(
                    testMigrator.address,
                    hexUtils.rightPad('0xdeadbeef'),
                ),
            );
        });

        it('reverting migration reverts', async () => {
            const tx = ownable
                .migrate(testMigrator.address, revertingMigrateFnCallData, newOwner)
                .awaitTransactionSuccessAsync({ from: owner });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.Ownable.MigrateCallFailedError(
                    testMigrator.address,
                    new StringRevertError('OOPSIE').encode(),
                ),
            );
        });
    });
});
