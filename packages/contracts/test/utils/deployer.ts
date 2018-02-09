import { Deployer } from '@0xproject/deployer';
import { devConstants } from '@0xproject/dev-utils';
import * as path from 'path';

import { constants } from '../../src/utils/constants';

const deployerOpts = {
    artifactsDir: path.resolve('src', 'artifacts'),
    jsonrpcPort: devConstants.RPC_PORT,
    networkId: constants.TESTRPC_NETWORK_ID,
    defaults: {
        gas: devConstants.GAS_ESTIMATE,
    },
};

export const deployer = new Deployer(deployerOpts);
