import { blockchainTests, expect, randomAddress } from '@0x/contracts-test-utils';
import { hexUtils, ZeroExRevertErrors } from '@0x/utils';

import { artifacts } from './artifacts';
import {
    IOwnableContract,
    ISimpleFunctionRegistryContract,
    TestBasicMigrationContract,
    ZeroExContract,
} from './wrappers';

blockchainTests.resets('Basic migration', env => {
    let owner: string;
    let zeroEx: ZeroExContract;
    let migrator: TestBasicMigrationContract;

    before(async () => {
        [owner] = await env.getAccountAddressesAsync();
        migrator = await TestBasicMigrationContract.deployFrom0xArtifactAsync(
            artifacts.TestBasicMigration,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        const migrateCall = migrator.migrate(owner);
        zeroEx = new ZeroExContract(await migrateCall.callAsync(), env.provider, env.txDefaults);
        await migrateCall.awaitTransactionSuccessAsync();
    });

    describe('bootstrapping', () => {
        it('Migrator cannot call bootstrap() again', async () => {
            const tx = migrator.callBootstrap(zeroEx.address).awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(new ZeroExRevertErrors.Proxy.AlreadyBootstrappedError());
        });
    });

    describe('Ownable feature', () => {
        let ownable: IOwnableContract;

        before(async () => {
            ownable = new IOwnableContract(zeroEx.address, env.provider, env.txDefaults);
        });

        it('has the correct owner', async () => {
            const actualOwner = await ownable.getOwner().callAsync();
            expect(actualOwner).to.eq(owner);
        });
    });

    describe('Registry feature', () => {
        let registry: ISimpleFunctionRegistryContract;

        before(async () => {
            registry = new ISimpleFunctionRegistryContract(zeroEx.address, env.provider, env.txDefaults);
        });

        it('`extendSelf()` is unregistered', async () => {
            const tx = registry.extendSelf(hexUtils.random(4), randomAddress()).callAsync();
            return expect(tx).to.revertWith(new ZeroExRevertErrors.Proxy.NotImplementedError());
        });
    });
});
