import { Deployer } from '@0xproject/deployer';
import { devConstants } from '@0xproject/dev-utils';
import * as path from 'path';

import { constants } from './constants';

import { provider } from './web3_wrapper';

const artifactsDir = path.resolve('test', 'artifacts');
const deployerOpts = {
    artifactsDir,
    provider,
    networkId: constants.TESTRPC_NETWORK_ID,
    defaults: {
        gas: devConstants.GAS_ESTIMATE,
    },
};
export const deployer = new Deployer(deployerOpts);
