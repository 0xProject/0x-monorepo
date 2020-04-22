import { blockchainTests, expect, LogDecoder, randomAddress, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { hexUtils, OwnableRevertErrors, StringRevertError, ZeroExRevertErrors } from '@0x/utils';

import { artifacts } from '../artifacts';
import { initialMigrateAsync } from '../utils/migration';
import { IMigrateContract, IOwnableContract, TestMigratorContract, TestMigratorEvents } from '../wrappers';

blockchainTests.resets('Migrate feature', env => {
    let owner: string;
    let ownable: IOwnableContract;
    let migrate: IMigrateContract;
    let testMigrator: TestMigratorContract;
    let succeedingMigrateFnCallData: string;
    let failingMigrateFnCallData: string;
    let revertingMigrateFnCallData: string;
    let logDecoder: LogDecoder;

    before(async () => {
        logDecoder = new LogDecoder(env.web3Wrapper, artifacts);
        [owner] = await env.getAccountAddressesAsync();
        const zeroEx = await initialMigrateAsync(owner, env.provider, env.txDefaults);
        ownable = new IOwnableContract(zeroEx.address, env.provider, env.txDefaults);
        migrate = new IMigrateContract(zeroEx.address, env.provider, env.txDefaults);
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

    describe('migrate()', () => {
        it('non-owner cannot call migrate()', async () => {
            const notOwner = randomAddress();
            const tx = migrate
                .migrate(testMigrator.address, succeedingMigrateFnCallData)
                .awaitTransactionSuccessAsync({ from: notOwner });
            return expect(tx).to.revertWith(new OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
        });

        it('can successfully execute a migration', async () => {
            const receipt = await migrate
                .migrate(testMigrator.address, succeedingMigrateFnCallData)
                .awaitTransactionSuccessAsync({ from: owner });
            const { logs } = logDecoder.decodeReceiptLogs(receipt);
            verifyEventsFromLogs(
                logs,
                [
                    {
                        callData: succeedingMigrateFnCallData,
                        owner: migrate.address,
                        actualOwner: owner,
                    },
                ],
                TestMigratorEvents.TestMigrateCalled,
            );
        });

        it('owner is restored after a migration', async () => {
            await migrate
                .migrate(testMigrator.address, succeedingMigrateFnCallData)
                .awaitTransactionSuccessAsync({ from: owner });
            const currentOwner = await ownable.getOwner().callAsync();
            expect(currentOwner).to.eq(owner);
        });

        it('failing migration reverts', async () => {
            const tx = migrate
                .migrate(testMigrator.address, failingMigrateFnCallData)
                .awaitTransactionSuccessAsync({ from: owner });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.Migrate.MigrateCallFailedError(
                    testMigrator.address,
                    hexUtils.rightPad('0xdeadbeef'),
                ),
            );
        });

        it('reverting migration reverts', async () => {
            const tx = migrate
                .migrate(testMigrator.address, revertingMigrateFnCallData)
                .awaitTransactionSuccessAsync({ from: owner });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.Migrate.MigrateCallFailedError(
                    testMigrator.address,
                    new StringRevertError('OOPSIE').encode(),
                ),
            );
        });
    });
});
