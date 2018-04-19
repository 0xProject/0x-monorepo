import { Deployer } from '@0xproject/deployer';
import { devConstants } from '@0xproject/dev-utils';
import * as path from 'path';

import { constants } from '../../src/utils/constants';

import { web3 } from './web3_wrapper';

const deployerOpts = {
    provider: web3.currentProvider,
    artifactsDir: path.resolve('lib', 'src', 'artifacts'),
    networkId: constants.TESTRPC_NETWORK_ID,
    defaults: {
        gas: devConstants.GAS_ESTIMATE,
    },
};

export const deployer = new Deployer(deployerOpts);
