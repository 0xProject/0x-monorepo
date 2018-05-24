import { devConstants } from '@0xproject/dev-utils';
import { runV1MigrationsAsync } from '@0xproject/migrations';
import 'make-promises-safe';
import * as path from 'path';

import { constants } from './utils/constants';
import { provider } from './utils/web3_wrapper';

before('migrate contracts', async function(): Promise<void> {
    // HACK: Since the migrations take longer then our global mocha timeout limit
    // we manually increase it for this before hook.
    const mochaTestTimeoutMs = 20000;
    this.timeout(mochaTestTimeoutMs);
    const txDefaults = {
        gas: devConstants.GAS_ESTIMATE,
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    };
    const artifactsDir = `../migrations/artifacts/1.0.0`;
    await runV1MigrationsAsync(provider, artifactsDir, txDefaults);
});
