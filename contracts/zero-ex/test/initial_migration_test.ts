import { blockchainTests, expect, randomAddress } from '@0x/contracts-test-utils';
import { hexUtils, ZeroExRevertErrors } from '@0x/utils';

import { artifacts } from './artifacts';
import { BootstrapFeatures, deployBootstrapFeaturesAsync } from './utils/migration';
import {
    IBootstrapFeatureContract,
    InitialMigrationContract,
    IOwnableFeatureContract,
    SimpleFunctionRegistryFeatureContract,
    TestInitialMigrationContract,
    ZeroExContract,
} from './wrappers';

blockchainTests.resets('Initial migration', env => {
    let owner: string;
    let zeroEx: ZeroExContract;
    let migrator: TestInitialMigrationContract;
    let bootstrapFeature: IBootstrapFeatureContract;
    let features: BootstrapFeatures;

    before(async () => {
        [owner] = await env.getAccountAddressesAsync();
        features = await deployBootstrapFeaturesAsync(env.provider, env.txDefaults);
        migrator = await TestInitialMigrationContract.deployFrom0xArtifactAsync(
            artifacts.TestInitialMigration,
            env.provider,
            env.txDefaults,
            artifacts,
            env.txDefaults.from as string,
        );
        bootstrapFeature = new IBootstrapFeatureContract(
            await migrator.bootstrapFeature().callAsync(),
            env.provider,
            env.txDefaults,
            {},
        );
        zeroEx = await ZeroExContract.deployFrom0xArtifactAsync(
            artifacts.ZeroEx,
            env.provider,
            env.txDefaults,
            artifacts,
            migrator.address,
        );
        await migrator.initializeZeroEx(owner, zeroEx.address, features).awaitTransactionSuccessAsync();
    });

    it('Self-destructs after deployment', async () => {
        const dieRecipient = await migrator.dieRecipient().callAsync();
        expect(dieRecipient).to.eq(owner);
    });

    it('Non-deployer cannot call initializeZeroEx()', async () => {
        const notDeployer = randomAddress();
        const tx = migrator.initializeZeroEx(owner, zeroEx.address, features).callAsync({ from: notDeployer });
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
            const doesExist = await env.web3Wrapper.doesContractExistAtAddressAsync(bootstrapFeature.address);
            expect(doesExist).to.eq(false);
        });
    });

    describe('Ownable feature', () => {
        let ownable: IOwnableFeatureContract;

        before(async () => {
            ownable = new IOwnableFeatureContract(zeroEx.address, env.provider, env.txDefaults);
        });

        it('has the correct owner', async () => {
            const actualOwner = await ownable.owner().callAsync();
            expect(actualOwner).to.eq(owner);
        });
    });

    describe('SimpleFunctionRegistry feature', () => {
        let registry: SimpleFunctionRegistryFeatureContract;

        before(async () => {
            registry = new SimpleFunctionRegistryFeatureContract(zeroEx.address, env.provider, env.txDefaults);
        });

        it('_extendSelf() is deregistered', async () => {
            const selector = registry.getSelector('_extendSelf');
            const tx = registry._extendSelf(hexUtils.random(4), randomAddress()).callAsync({ from: zeroEx.address });
            return expect(tx).to.revertWith(new ZeroExRevertErrors.Proxy.NotImplementedError(selector));
        });
    });
});
