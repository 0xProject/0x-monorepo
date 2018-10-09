import { devConstants } from '@0xproject/dev-utils';
import { runMigrationsOnceAsync } from '@0xproject/migrations';
import { ContractAddresses } from '@0xproject/types';

import { provider } from './web3_wrapper';

/**
 * Configures and runs the migrations exactly once. Any subsequent times this is
 * called, it returns the cached addresses.
 * @returns The addresses of contracts that were deployed during the migrations.
 */
export async function migrateOnceAsync(): Promise<ContractAddresses> {
    const txDefaults = {
        gas: devConstants.GAS_LIMIT,
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    };
    return runMigrationsOnceAsync(provider, txDefaults);
}
