#!/usr/bin/env node
import { devConstants, web3Factory } from '@0xproject/dev-utils';
import { Provider } from '@0xproject/types';
import { logUtils } from '@0xproject/utils';
import * as path from 'path';
import * as yargs from 'yargs';

import { runV1MigrationsAsync } from './v1/migration';
import { runV2MigrationsAsync } from './v2/migration';

enum ContractVersions {
    V1 = '1.0.0',
    V2 = '2.0.0',
}
const args = yargs.argv;

(async () => {
    const txDefaults = {
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    };
    const providerConfigs = { shouldUseInProcessGanache: false };
    const provider: Provider = web3Factory.getRpcProvider(providerConfigs);
    const contractsVersion = args.contractsVersion;
    const artifactsDir = `artifacts/${contractsVersion}`;
    if (contractsVersion === ContractVersions.V1) {
        await runV1MigrationsAsync(provider, artifactsDir, txDefaults);
    } else {
        await runV2MigrationsAsync(provider, artifactsDir, txDefaults);
    }
    process.exit(0);
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
