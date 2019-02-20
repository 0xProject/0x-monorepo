#!/usr/bin/env node
import { devConstants, web3Factory } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { logUtils } from '@0x/utils';

import { runMigrationsAsync } from './migration';

(async () => {
    let providerConfigs;
    let provider: Web3ProviderEngine;
    let txDefaults;

    providerConfigs = { shouldUseInProcessGanache: false };
    provider = web3Factory.getRpcProvider(providerConfigs);
    txDefaults = {
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    };
    await runMigrationsAsync(provider, txDefaults);
    process.exit(0);
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
