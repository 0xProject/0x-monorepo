#!/usr/bin/env node
import { Deployer } from '@0xproject/deployer';
import { devConstants, web3Factory } from '@0xproject/dev-utils';
import { Provider } from '@0xproject/types';
import { logUtils } from '@0xproject/utils';
import * as path from 'path';

import { runMigrationsAsync } from './migration';

(async () => {
    const defaults = {
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    };
    const providerConfigs = { shouldUseInProcessGanache: false };
    const web3 = web3Factory.create(providerConfigs);
    const provider = web3.currentProvider;
    const artifactsDir = 'artifacts/1.0.0';
    await runMigrationsAsync(provider, artifactsDir, defaults);
    process.exit(0);
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
