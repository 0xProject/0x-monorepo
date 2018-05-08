#!/usr/bin/env node
import { Deployer } from '@0xproject/deployer';
import { devConstants } from '@0xproject/dev-utils';
import { logUtils } from '@0xproject/utils';
import * as path from 'path';

import { runMigrationsAsync } from './migration';

(async () => {
    const deployerOpts = {
        jsonrpcUrl: 'http://localhost:8545',
        artifactsDir: path.resolve('artifacts', '1.0.0'),
        networkId: 50,
        defaults: {
            gas: devConstants.GAS_ESTIMATE,
        },
    };

    const deployer = new Deployer(deployerOpts);

    await runMigrationsAsync(deployer);
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
