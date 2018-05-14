import { devConstants } from '@0xproject/dev-utils';
import { runMigrationsAsync } from '@0xproject/migrations';
import * as path from 'path';

import { constants } from './utils/constants';
import { provider } from './utils/web3_wrapper';

before('migrate contracts', async function(): Promise<void> {
    // HACK: Since the migrations take longer then our global mocha timeout limit
    // we manually increase it for this before hook.
    this.timeout(20000);
    const txDefaults = {
        gas: devConstants.GAS_ESTIMATE,
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    };
    const artifactsDir = `../migrations/artifacts/1.0.0`;
    await runMigrationsAsync(provider, artifactsDir, txDefaults);
});
