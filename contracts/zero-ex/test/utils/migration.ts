import { SupportedProvider } from '@0x/subproviders';
import { TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from '../artifacts';
import {
    FullMigrationContract,
    InitialMigrationContract,
    PuppetPoolContract,
    TokenSpenderContract,
    TransformERC20Contract,
    ZeroExContract,
} from '../wrappers';

// tslint:disable: completed-docs
export async function initialMigrateAsync(
    owner: string,
    provider: SupportedProvider,
    txDefaults: Partial<TxData>,
): Promise<ZeroExContract> {
    const migrator = await InitialMigrationContract.deployFrom0xArtifactAsync(
        artifacts.InitialMigration,
        provider,
        txDefaults,
        artifacts,
        txDefaults.from as string,
    );
    const deployCall = migrator.deploy(owner);
    const zeroEx = new ZeroExContract(await deployCall.callAsync(), provider, {});
    await deployCall.awaitTransactionSuccessAsync();
    return zeroEx;
}

export interface FeatureAddresses {
    tokenSpender: string;
    puppetPool: string;
    transformERC20: string;
}

export async function fullMigrateAsync(
    owner: string,
    provider: SupportedProvider,
    txDefaults: Partial<TxData>,
    features: Partial<FeatureAddresses> = {},
): Promise<ZeroExContract> {
    const commonDeployArgs: [SupportedProvider, Partial<TxData>, {}] = [provider, txDefaults, artifacts];
    // prettier-ignore
    const _features = {
        tokenSpender: (await TokenSpenderContract.deployFrom0xArtifactAsync(
            artifacts.TokenSpender,
            ...commonDeployArgs,
        )).address,
        puppetPool: (await PuppetPoolContract.deployFrom0xArtifactAsync(
            artifacts.PuppetPool,
            ...commonDeployArgs,
        )).address,
        transformERC20: (await TransformERC20Contract.deployFrom0xArtifactAsync(
            artifacts.TransformERC20,
            ...commonDeployArgs,
        )).address,
        ...features,
    };
    const migrator = await FullMigrationContract.deployFrom0xArtifactAsync(
        artifacts.FullMigration,
        provider,
        txDefaults,
        artifacts,
        txDefaults.from as string,
        _features,
    );
    const deployCall = migrator.deploy(owner);
    const zeroEx = new ZeroExContract(await deployCall.callAsync(), provider, {});
    await deployCall.awaitTransactionSuccessAsync();
    return zeroEx;
}
