#!/usr/bin/env node
import { devConstants, web3Factory } from '@0xproject/dev-utils';
import { logUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as yargs from 'yargs';

import { runV1MigrationsAsync } from './1.0.0/migration';
import { runV2TestnetMigrationsAsync } from './2.0.0-beta-testnet/migration';
import { runV2MainnetMigrationsAsync } from './2.0.0-mainnet/migration';
import { runV2MigrationsAsync } from './2.0.0/migration';

import { providerFactory } from './utils/provider_factory';

enum ContractVersions {
    V1 = '1.0.0',
    V2 = '2.0.0',
    V2Testnet = '2.0.0-beta-testnet',
    V2Mainnet = '2.0.0-mainnet',
}
const args = yargs.argv;

(async () => {
    const contractsVersion = args.contractsVersion;
    const artifactsDir = `artifacts/${contractsVersion}`;
    let providerConfigs;
    let provider: Provider;
    let txDefaults;
    let web3Wrapper: Web3Wrapper;
    let accounts: string[];
    switch (contractsVersion) {
        case ContractVersions.V1:
            providerConfigs = { shouldUseInProcessGanache: false };
            provider = web3Factory.getRpcProvider(providerConfigs);
            txDefaults = {
                from: devConstants.TESTRPC_FIRST_ADDRESS,
            };
            await runV1MigrationsAsync(provider, artifactsDir, txDefaults);
            break;
        case ContractVersions.V2:
            providerConfigs = { shouldUseInProcessGanache: false };
            provider = web3Factory.getRpcProvider(providerConfigs);
            txDefaults = {
                from: devConstants.TESTRPC_FIRST_ADDRESS,
            };
            await runV2MigrationsAsync(provider, artifactsDir, txDefaults);
            break;
        case ContractVersions.V2Testnet:
            provider = await providerFactory.getLedgerProviderAsync();
            web3Wrapper = new Web3Wrapper(provider);
            accounts = await web3Wrapper.getAvailableAddressesAsync();
            txDefaults = {
                from: accounts[0],
                gas: devConstants.GAS_LIMIT,
            };
            await runV2TestnetMigrationsAsync(provider, artifactsDir, txDefaults);
            break;
        case ContractVersions.V2Mainnet:
            provider = await providerFactory.getLedgerProviderAsync();
            web3Wrapper = new Web3Wrapper(provider);
            accounts = await web3Wrapper.getAvailableAddressesAsync();
            txDefaults = {
                from: accounts[0],
                gas: devConstants.GAS_LIMIT,
            };
            await runV2MainnetMigrationsAsync(provider, artifactsDir, txDefaults);
            break;
        default:
            throw new Error(`Unsupported contract version: ${contractsVersion}`);
    }
    process.exit(0);
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
