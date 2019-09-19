#!/usr/bin/env node
import { devConstants, web3Factory } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { logUtils } from '@0x/utils';
import HDWalletProvider = require('truffle-hdwallet-provider');

import { runMigrationsAsync } from './migration';

(async () => {
    const provider = new HDWalletProvider("gene's wallet mnemonic", "gene's kovan infura API url");
    const txDefaults = {
        from: '0x75D0aaf1E32Cfac05f3704108CE99de13d12503a',
    };
    logUtils.log(JSON.stringify(await runMigrationsAsync(provider, txDefaults), null, '\t'));
    process.exit(0);
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
