import { Deployer } from '@0xproject/deployer';
import { devConstants } from '@0xproject/dev-utils';
import * as path from 'path';

import { web3Wrapper } from './web3_wrapper';

const deployerOpts = {
    web3Provider: web3Wrapper.getProvider(),
    artifactsDir: path.resolve('artifacts'),
    networkId: 50,
    defaults: {
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    },
};

export const deployer = new Deployer(deployerOpts);
