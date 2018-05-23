#!/usr/bin/env node
import { devConstants, web3Factory } from '@0xproject/dev-utils';
import { Provider } from '@0xproject/types';
import { logUtils } from '@0xproject/utils';
import * as path from 'path';

import { runMigrationsAsync } from './migration';

(async () => {
    const txDefaults = {
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    };
    const providerConfigs = { shouldUseInProcessGanache: false };
    const provider: Provider = web3Factory.getRpcProvider(providerConfigs);
    const artifactsDir = 'artifacts/1.0.0';
    await runMigrationsAsync(provider, artifactsDir, txDefaults);
    process.exit(0);
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
