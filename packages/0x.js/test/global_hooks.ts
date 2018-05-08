import { devConstants } from '@0xproject/dev-utils';
import { runMigrationsAsync } from '@0xproject/migrations';
import * as path from 'path';

import { constants } from './utils/constants';
import { provider } from './utils/web3_wrapper';

before('migrate contracts', async function() {
    this.timeout(20000);
    const defaults = {
        gas: devConstants.GAS_ESTIMATE,
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    };
    const artifactsDir = path.resolve('test', 'artifacts');
    await runMigrationsAsync(provider, artifactsDir, defaults);
});
