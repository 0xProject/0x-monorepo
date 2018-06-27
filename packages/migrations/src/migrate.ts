#!/usr/bin/env node
import { devConstants, web3Factory } from '@0xproject/dev-utils';
import { logUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as yargs from 'yargs';

import { runV1MigrationsAsync } from './1.0.0/migration';
import { runV2TestnetMigrationsAsync } from './2.0.0-beta-testnet/migration';
import { runV2MigrationsAsync } from './2.0.0/migration';

import { providerFactory } from './utils/provider_factory';

enum ContractVersions {
    V1 = '1.0.0',
    V2 = '2.0.0',
    V2Testnet = '2.0.0-beta-testnet',
}
const args = yargs.argv;

(async () => {
    const providerConfigs = { shouldUseInProcessGanache: false };
    const provider: Provider = web3Factory.getRpcProvider(providerConfigs);
    const txDefaults = {
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    };
    const contractsVersion = args.contractsVersion;
    const artifactsDir = `artifacts/${contractsVersion}`;
    switch (contractsVersion) {
        case ContractVersions.V1:
            await runV1MigrationsAsync(provider, artifactsDir, txDefaults);
            break;
        case ContractVersions.V2:
            await runV2MigrationsAsync(provider, artifactsDir, txDefaults);
            break;
        case ContractVersions.V2Testnet:
            const ledgerProvider = await providerFactory.getLedgerProviderAsync();
            const web3Wrapper = new Web3Wrapper(ledgerProvider);
            const accounts = await web3Wrapper.getAvailableAddressesAsync();
            const testnetTxDefaults = {
                from: accounts[0],
            };
            await runV2TestnetMigrationsAsync(ledgerProvider, artifactsDir, testnetTxDefaults);
            break;
        default:
            throw new Error(`Unsupported contract version: ${contractsVersion}`);
    }
    process.exit(0);
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
