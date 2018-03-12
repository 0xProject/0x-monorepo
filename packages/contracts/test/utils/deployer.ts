import { Deployer } from '@0xproject/deployer';
import { devConstants } from '@0xproject/dev-utils';
import * as path from 'path';

import { constants } from '../../util/constants';

import { web3 } from './web3_wrapper';

const deployerOpts = {
    web3Provider: web3.currentProvider,
    artifactsDir: path.resolve('src', 'artifacts'),
    jsonrpcUrl: devConstants.RPC_URL,
    networkId: constants.TESTRPC_NETWORK_ID,
    defaults: {
        gas: devConstants.GAS_ESTIMATE,
    },
};

export const deployer = new Deployer(deployerOpts);
