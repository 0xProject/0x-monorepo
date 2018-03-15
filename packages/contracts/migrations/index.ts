import { Deployer } from '@0xproject/deployer';
import { devConstants } from '@0xproject/dev-utils';
import * as path from 'path';

import { constants } from '../util/constants';

import { runMigrationsAsync } from './migrate';

const deployerOpts = {
    artifactsDir: path.resolve('src', 'artifacts'),
    jsonrpcUrl: devConstants.RPC_URL,
    networkId: constants.TESTRPC_NETWORK_ID,
    defaults: {
        gas: devConstants.GAS_ESTIMATE,
    },
};

export const deployer = new Deployer(deployerOpts);

runMigrationsAsync(deployer).catch(console.log);
