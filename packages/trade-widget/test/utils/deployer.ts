import { Deployer } from '@0xproject/deployer';
import { devConstants } from '@0xproject/dev-utils';
import * as path from 'path';

import { web3 } from './web3_wrapper';

const deployerOpts = {
    web3Provider: web3.currentProvider,
    artifactsDir: path.resolve('src', 'ts', 'artifacts'),
    jsonrpcUrl: devConstants.RPC_URL,
    networkId: 50,
    defaults: {
        gas: devConstants.GAS_ESTIMATE,
    },
};

export const deployer = new Deployer(deployerOpts);
