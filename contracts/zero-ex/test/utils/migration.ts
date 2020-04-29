import { SupportedProvider } from '@0x/subproviders';
import { TxData } from 'ethereum-types';

import { artifacts } from '../artifacts';
import { InitialMigrationContract, ZeroExContract } from '../wrappers';

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
