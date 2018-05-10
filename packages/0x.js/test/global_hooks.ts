import { devConstants } from '@0xproject/dev-utils';
import { runMigrationsAsync } from '@0xproject/migrations';
import * as path from 'path';

import { constants } from './utils/constants';
import { provider } from './utils/web3_wrapper';

before('migrate contracts', async function() {
    // HACK: Since the migrations take longer then our global mocha timeout limit
    // we manually increase it for this before hook.
    this.timeout(20000);
    const defaults = {
        gas: devConstants.GAS_ESTIMATE,
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    };
    const artifactsDir = `../migrations/artifacts/${constants.ARTIFACTS_VERSION}`;
    await runMigrationsAsync(provider, artifactsDir, defaults);
});
