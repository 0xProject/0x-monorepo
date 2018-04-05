import { Deployer } from '@0xproject/deployer';
import { devConstants } from '@0xproject/dev-utils';
import * as path from 'path';

import { constants } from '../../../contracts/src/utils/constants';

import { provider } from './web3_wrapper';

const deployerOpts = {
    web3Provider: provider,
    artifactsDir: path.resolve('src', 'ts', 'artifacts'),
    networkId: constants.TESTRPC_NETWORK_ID,
    defaults: {
        gas: devConstants.GAS_ESTIMATE,
    },
};

export const deployer = new Deployer(deployerOpts);
