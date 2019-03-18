#!/usr/bin/env node
import { devConstants } from '@0x/dev-utils';
import { MnemonicWalletSubprovider, RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { logUtils, providerUtils } from '@0x/utils';

import { runMigrationsAsync } from './migration';

(async () => {
    let txDefaults;
    const provider = new Web3ProviderEngine();
    const mnemonic = 'concert load couple harbor equip island argue ramp clarify fence smart topic';
    provider.addProvider(new MnemonicWalletSubprovider({ mnemonic }));
    provider.addProvider(new RPCSubprovider('http://localhost:8545'));
    providerUtils.startProviderEngine(provider);

    txDefaults = {
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    };
    await runMigrationsAsync(provider, txDefaults);
    process.exit(0);
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
