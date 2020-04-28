import { blockchainTests, expect } from '@0x/contracts-test-utils';
import { ZeroExRevertErrors } from '@0x/utils';

import { artifacts } from './artifacts';
import { IBootstrapContract, IOwnableContract, TestInitialMigrationContract, ZeroExContract } from './wrappers';

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

    describe('bootstrapping', () => {
        it('Migrator cannot call bootstrap() again', async () => {
            const tx = migrator.callBootstrap(zeroEx.address).awaitTransactionSuccessAsync();
            const selector = bootstrapFeature.getSelector('bootstrap');
            return expect(tx).to.revertWith(new ZeroExRevertErrors.Proxy.NotImplementedError(selector));
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

    it('bootstrap feature self destructs after deployment', async () => {
        const codeSize = await migrator.getCodeSizeOf(bootstrapFeature.address).callAsync();
        expect(codeSize).to.bignumber.eq(0);
    });
});
