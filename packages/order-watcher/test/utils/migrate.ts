import { devConstants } from '@0xproject/dev-utils';
import { runMigrationsOnceAsync } from '@0xproject/migrations';
import { ContractAddresses } from '@0xproject/types';

import { provider } from './web3_wrapper';

export async function migrateOnceAsync(): Promise<ContractAddresses> {
    const txDefaults = {
        gas: devConstants.GAS_LIMIT,
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    };
    return runMigrationsOnceAsync(provider, txDefaults);
}
