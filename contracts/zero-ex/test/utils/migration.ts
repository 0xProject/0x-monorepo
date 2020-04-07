import { SupportedProvider } from '@0x/subproviders';
import { TxData } from 'ethereum-types';

import { artifacts } from '../artifacts';
import { BasicMigrationContract, ZeroExContract } from '../wrappers';

// tslint:disable: completed-docs
export async function basicMigrateAsync(
    owner: string,
    provider: SupportedProvider,
    txDefaults: Partial<TxData>,
): Promise<ZeroExContract> {
    const migrator = await BasicMigrationContract.deployFrom0xArtifactAsync(
        artifacts.BasicMigration,
        provider,
        txDefaults,
        artifacts,
    );
    const migrateCall = migrator.migrate(owner);
    const zeroEx = new ZeroExContract(await migrateCall.callAsync(), provider, {});
    await migrateCall.awaitTransactionSuccessAsync();
    return zeroEx;
}
