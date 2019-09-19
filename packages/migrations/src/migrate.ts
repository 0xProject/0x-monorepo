#!/usr/bin/env node
import { devConstants, web3Factory } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { logUtils } from '@0x/utils';
import HDWalletProvider = require('truffle-hdwallet-provider');

import { runMigrationsAsync } from './migration';

(async () => {
    const provider = new HDWalletProvider(process.env.MNEMONIC as string, process.env.RPC_URL as string);
    const txDefaults = {
        from: provider.getAddresses()[0],
    };
    logUtils.log(JSON.stringify(await runMigrationsAsync(provider, txDefaults), null, '\t'));
    process.exit(0);
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
