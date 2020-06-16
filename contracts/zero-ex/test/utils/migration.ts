import { BaseContract } from '@0x/base-contract';
import { SupportedProvider } from '@0x/subproviders';
import { TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from '../artifacts';
import {
    FullMigrationContract,
    InitialMigrationContract,
    OwnableContract,
    SimpleFunctionRegistryContract,
    TokenSpenderContract,
    TransformERC20Contract,
    ZeroExContract,
} from '../wrappers';

// tslint:disable: completed-docs

export interface BootstrapFeatures {
    registry: SimpleFunctionRegistryContract;
    ownable: OwnableContract;
}

export async function deployBootstrapFeaturesAsync(
    provider: SupportedProvider,
    txDefaults: Partial<TxData>,
    features: Partial<BootstrapFeatures> = {},
): Promise<BootstrapFeatures> {
    return {
        registry:
            features.registry ||
            (await SimpleFunctionRegistryContract.deployFrom0xArtifactAsync(
                artifacts.SimpleFunctionRegistry,
                provider,
                txDefaults,
                artifacts,
            )),
        ownable:
            features.ownable ||
            (await OwnableContract.deployFrom0xArtifactAsync(artifacts.Ownable, provider, txDefaults, artifacts)),
    };
}

export async function initialMigrateAsync(
    owner: string,
    provider: SupportedProvider,
    txDefaults: Partial<TxData>,
    features: Partial<BootstrapFeatures> = {},
): Promise<ZeroExContract> {
    const _features = await deployBootstrapFeaturesAsync(provider, txDefaults, features);
    const migrator = await InitialMigrationContract.deployFrom0xArtifactAsync(
        artifacts.InitialMigration,
        provider,
        txDefaults,
        artifacts,
        txDefaults.from as string,
    );
    const deployCall = migrator.deploy(owner, toFeatureAdddresses(_features));
    const zeroEx = new ZeroExContract(await deployCall.callAsync(), provider, {});
    await deployCall.awaitTransactionSuccessAsync();
    return zeroEx;
}

export interface FullFeatures extends BootstrapFeatures {
    tokenSpender: TokenSpenderContract;
    transformERC20: TransformERC20Contract;
}

export interface FullMigrationOpts {
    transformerDeployer: string;
}

export async function deployFullFeaturesAsync(
    provider: SupportedProvider,
    txDefaults: Partial<TxData>,
    features: Partial<FullFeatures> = {},
): Promise<FullFeatures> {
    return {
        ...(await deployBootstrapFeaturesAsync(provider, txDefaults)),
        tokenSpender:
            features.tokenSpender ||
            (await TokenSpenderContract.deployFrom0xArtifactAsync(
                artifacts.TokenSpender,
                provider,
                txDefaults,
                artifacts,
            )),
        transformERC20:
            features.transformERC20 ||
            (await TransformERC20Contract.deployFrom0xArtifactAsync(
                artifacts.TransformERC20,
                provider,
                txDefaults,
                artifacts,
            )),
    };
}

export async function fullMigrateAsync(
    owner: string,
    provider: SupportedProvider,
    txDefaults: Partial<TxData>,
    features: Partial<FullFeatures> = {},
    opts: Partial<FullMigrationOpts> = {},
): Promise<ZeroExContract> {
    const _features = await deployFullFeaturesAsync(provider, txDefaults, features);
    const migrator = await FullMigrationContract.deployFrom0xArtifactAsync(
        artifacts.FullMigration,
        provider,
        txDefaults,
        artifacts,
        txDefaults.from as string,
    );
    const _opts = {
        transformerDeployer: txDefaults.from as string,
        ...opts,
    };
    const deployCall = migrator.deploy(owner, toFeatureAdddresses(_features), _opts);
    const zeroEx = new ZeroExContract(await deployCall.callAsync(), provider, {});
    await deployCall.awaitTransactionSuccessAsync();
    return zeroEx;
}

// tslint:disable:space-before-function-parent one-line
export function toFeatureAdddresses<T extends BootstrapFeatures | FullFeatures | (BootstrapFeatures & FullFeatures)>(
    features: T,
): { [name in keyof T]: string } {
    // TS can't figure this out.
    return _.mapValues(features, (c: BaseContract) => c.address) as any;
}
