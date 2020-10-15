import { blockchainTests, constants, expect, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { BigNumber, hexUtils, OwnableRevertErrors, ZeroExRevertErrors } from '@0x/utils';
import { SupportedProvider } from '@0x/subproviders';
import { TxData } from 'ethereum-types';

import { ZeroExContract, OwnableFeatureContract, SimpleFunctionRegistryFeatureContract, InitialMigrationContract} from '../../src/wrappers';
import { artifacts } from '../artifacts';
import { initialMigrateAsync } from '../utils/migration';
import {
    ISimpleFunctionRegistryFeatureContract,
    IBenchmarkSimpleFunctionRegistryFeatureContract,
    BenchmarkSimpleFunctionRegistryFeatureContract,
    ISimpleFunctionRegistryFeatureEvents,
    AssemblyZeroExContract,
} from '../wrappers';
import {  } from 'lodash';

blockchainTests.resets('Benchmarking Tests', env => {
    const { NULL_ADDRESS } = constants;
    let owner: string;
    let zeroEx: ZeroExContract;
    let assemblyZeroEx: AssemblyZeroExContract;
    let registry: ISimpleFunctionRegistryFeatureContract;
    let registryAssembly: ISimpleFunctionRegistryFeatureContract;
    let testFeature: IBenchmarkSimpleFunctionRegistryFeatureContract;
    let testFeatureAssembly: IBenchmarkSimpleFunctionRegistryFeatureContract;
    const testFnSelector: string = "0x86fddd71";
    let testFeatureImpl1: BenchmarkSimpleFunctionRegistryFeatureContract;

    before(async () => {
        [owner] = await env.getAccountAddressesAsync();
        zeroEx = await initialMigrateAsync(owner, env.provider, env.txDefaults);
        assemblyZeroEx = await initialMigrateAsyncAssembly(owner, env.provider, env.txDefaults);
        registry = new ISimpleFunctionRegistryFeatureContract(zeroEx.address, env.provider, {
            ...env.txDefaults,
            from: owner,
        });
        registryAssembly = new ISimpleFunctionRegistryFeatureContract(assemblyZeroEx.address, env.provider, {
            ...env.txDefaults,
            from: owner,
        });
        testFeature = new IBenchmarkSimpleFunctionRegistryFeatureContract(zeroEx.address, env.provider, env.txDefaults)
        testFeatureAssembly = new IBenchmarkSimpleFunctionRegistryFeatureContract(assemblyZeroEx.address, env.provider, env.txDefaults)
        testFeatureImpl1 = await BenchmarkSimpleFunctionRegistryFeatureContract.deployFrom0xArtifactAsync(
            artifacts.BenchmarkSimpleFunctionRegistryFeature,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });


    it('`Benchmark test', async () => {
        // console.log(testFeatureImpl1.address);
        // let { logs } = await registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        // verifyEventsFromLogs(
        //     logs,
        //     [{ selector: testFnSelector, oldImpl: NULL_ADDRESS, newImpl: testFeatureImpl1.address }],
        //     ISimpleFunctionRegistryFeatureEvents.ProxyFunctionUpdated,
        // );
        // let called_testFnSelector = testFeature.getSelector('testFn');
        // expect(called_testFnSelector).to.be.eq(testFnSelector);

        let words = "0x";
        console.log(await assemblyZeroEx.getStroageSlot_pub().callAsync());
        // A random word [256 bits] derived from blockhash
        let single_word = "3bb5085365ddaf8a5723215456d6912dc14dbae7bf1a890ab11366a9a09013be"
        let previous = 0;
        for (let i = 0; i < 100; i++) {
            const tx_routed = await testFeatureAssembly.testFn(words).awaitTransactionSuccessAsync();
            const tx_unrouted = await testFeatureImpl1.testFn(words).awaitTransactionSuccessAsync();
            //Intentionally failing to stop the tests from running
            let overage = tx_routed.gasUsed - tx_unrouted.gasUsed;
            console.log("Overage", overage);
            console.log("Increase:", overage - previous);
            previous = overage;
            words += single_word;
        }
        expect(false).to.be.eq(true);
    });

});

interface BootstrapFeatures {
    registry: string;
    ownable: string;
}

/**
 * Migrate an instance of the Exchange proxy with minimum viable features.
 */
async function initialMigrateAsyncAssembly(
    owner: string,
    provider: SupportedProvider,
    txDefaults: Partial<TxData>,
    features: Partial<BootstrapFeatures> = {},
): Promise<AssemblyZeroExContract> {
    const migrator = await InitialMigrationContract.deployFrom0xArtifactAsync(
        artifacts.InitialMigration,
        provider,
        txDefaults,
        artifacts,
        txDefaults.from as string,
    );
    const zeroExAssembly = await AssemblyZeroExContract.deployFrom0xArtifactAsync(
        artifacts.AssemblyZeroEx,
        provider,
        txDefaults,
        artifacts,
        migrator.address,
    );
    const _features = await deployBootstrapFeaturesAsync(provider, txDefaults, features);
    await migrator.initializeZeroEx(owner, zeroExAssembly.address, _features).awaitTransactionSuccessAsync();
    return zeroExAssembly;
}

/**
 * Deploy the minimum features of the Exchange Proxy.
 */
async function deployBootstrapFeaturesAsync(
    provider: SupportedProvider,
    txDefaults: Partial<TxData>,
    features: Partial<BootstrapFeatures> = {},
): Promise<BootstrapFeatures> {
    return {
        registry:
            features.registry ||
            (await SimpleFunctionRegistryFeatureContract.deployFrom0xArtifactAsync(
                artifacts.SimpleFunctionRegistryFeature,
                provider,
                txDefaults,
                artifacts,
            )).address,
        ownable:
            features.ownable ||
            (await OwnableFeatureContract.deployFrom0xArtifactAsync(
                artifacts.OwnableFeature,
                provider,
                txDefaults,
                artifacts,
            )).address,
    };
}
