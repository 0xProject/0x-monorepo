import { blockchainTests, expect, randomAddress } from '@0x/contracts-test-utils';
import { ZeroExRevertErrors } from '@0x/utils';

import { artifacts } from './artifacts';
import {
    IBootstrapContract,
    InitialMigrationContract,
    IOwnableContract,
    TestInitialMigrationContract,
    ZeroExContract,
} from './wrappers';

blockchainTests.resets('Initial migration', env => {
    let owner: string;
    let zeroEx: ZeroExContract;
    let migrator: TestInitialMigrationContract;
    let bootstrapFeature: IBootstrapContract;

    before(async () => {
        [owner] = await env.getAccountAddressesAsync();
        migrator = await TestInitialMigrationContract.deployFrom0xArtifactAsync(
            artifacts.TestInitialMigration,
            env.provider,
            env.txDefaults,
            artifacts,
            env.txDefaults.from as string,
        );
        bootstrapFeature = new IBootstrapContract(
            await migrator.bootstrapFeature().callAsync(),
            env.provider,
            env.txDefaults,
            {},
        );
        const deployCall = migrator.deploy(owner);
        zeroEx = new ZeroExContract(await deployCall.callAsync(), env.provider, env.txDefaults);
        await deployCall.awaitTransactionSuccessAsync();
    });

    it('Self-destructs after deployment', async () => {
        const dieRecipient = await migrator.dieRecipient().callAsync();
        expect(dieRecipient).to.eq(owner);
    });

    it('Non-deployer cannot call deploy()', async () => {
        const notDeployer = randomAddress();
        const tx = migrator.deploy(owner).callAsync({ from: notDeployer });
        return expect(tx).to.revertWith('InitialMigration/INVALID_SENDER');
    });

    it('External contract cannot call die()', async () => {
        const _migrator = await InitialMigrationContract.deployFrom0xArtifactAsync(
            artifacts.InitialMigration,
            env.provider,
            env.txDefaults,
            artifacts,
            env.txDefaults.from as string,
        );
        const tx = _migrator.die(owner).callAsync();
        return expect(tx).to.revertWith('InitialMigration/INVALID_SENDER');
    });

    describe('bootstrapping', () => {
        it('Migrator cannot call bootstrap() again', async () => {
            const tx = migrator.callBootstrap(zeroEx.address).awaitTransactionSuccessAsync();
            const selector = bootstrapFeature.getSelector('bootstrap');
            return expect(tx).to.revertWith(new ZeroExRevertErrors.Proxy.NotImplementedError(selector));
        });

        it('Bootstrap feature self destructs after deployment', async () => {
            const codeSize = await migrator.getCodeSizeOf(bootstrapFeature.address).callAsync();
            expect(codeSize).to.bignumber.eq(0);
        });
    });

    describe('Ownable feature', () => {
        let ownable: IOwnableContract;

        before(async () => {
            ownable = new IOwnableContract(zeroEx.address, env.provider, env.txDefaults);
        });

        it('has the correct owner', async () => {
            const actualOwner = await ownable.owner().callAsync();
            expect(actualOwner).to.eq(owner);
        });
    });
});
