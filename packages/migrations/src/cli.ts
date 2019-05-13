#!/usr/bin/env node
import { PrivateKeyWalletSubprovider, RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { logUtils, providerUtils } from '@0x/utils';
import * as yargs from 'yargs';

import { runMigrationsAsync } from './migration';

const args = yargs
    .option('rpc-url', {
        describe: 'Endpoint where backing Ethereum JSON RPC interface is available',
        type: 'string',
        demandOption: false,
        default: 'http://localhost:8545',
    })
    .option('from', {
        describe: 'Ethereum address from which to deploy the contracts',
        type: 'string',
        demandOption: true,
    })
    .option('pk', {
        describe: 'Private key for the `from` address',
        type: 'string',
    })
    .example(
        '$0 --rpc-url http://localhost:8545 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --pk 0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d',
        'Full usage example',
    ).argv;

(async () => {
    const rpcSubprovider = new RPCSubprovider(args['rpc-url']);
    const provider = new Web3ProviderEngine();

    if (args.pk !== undefined && args.pk !== '') {
        const pkSubprovider = new PrivateKeyWalletSubprovider(args.pk as string);
        provider.addProvider(pkSubprovider);
    }

    provider.addProvider(rpcSubprovider);
    providerUtils.startProviderEngine(provider);
    const normalizedFromAddress = (args.from as string).toLowerCase();
    const txDefaults = {
        from: normalizedFromAddress,
    };
    await runMigrationsAsync(provider, txDefaults);
    process.exit(0);
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
