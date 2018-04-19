import { Deployer } from '@0xproject/deployer';
import { devConstants } from '@0xproject/dev-utils';
import * as path from 'path';

import { config } from './config';
import { web3Wrapper } from './web3_wrapper';

const deployerOpts = {
    provider: web3Wrapper.getProvider(),
    artifactsDir: config.artifactsDir,
    networkId: config.networkId,
    defaults: {
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    },
};

export const deployer = new Deployer(deployerOpts);
