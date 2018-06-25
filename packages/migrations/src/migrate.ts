#!/usr/bin/env node
import { devConstants, web3Factory } from '@0xproject/dev-utils';
import { logUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as yargs from 'yargs';

import { runV1MigrationsAsync } from './1.0.0/migration';
import { runV2BetaKovanMigrationsAsync } from './2.0.0-beta-kovan/migration';
import { runV2MigrationsAsync } from './2.0.0/migration';

enum ContractVersions {
    V1 = '1.0.0',
    V2 = '2.0.0',
    V2BetaKovan = '2.0.0-beta-kovan',
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
    if (contractsVersion === ContractVersions.V1) {
        await runV1MigrationsAsync(provider, artifactsDir, txDefaults);
    } else if (contractsVersion === ContractVersions.V2) {
        await runV2MigrationsAsync(provider, artifactsDir, txDefaults);
    } else {
        const web3Wrapper = new Web3Wrapper(provider);
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const kovanTxDefaults = {
            from: accounts[0],
        };
        await runV2BetaKovanMigrationsAsync(provider, artifactsDir, kovanTxDefaults);
    }
    process.exit(0);
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
