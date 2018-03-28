import { env, EnvVars } from '@0xproject/dev-utils';
import { GanacheSubprovider } from '@0xproject/subproviders';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as fs from 'fs';
import * as _ from 'lodash';
import ProviderEngine = require('web3-provider-engine');

import { coverage } from './coverage';

export const web3Provider = new ProviderEngine();
const isCoverageEnabled = env.parseBoolean(EnvVars.SolidityCoverage);
if (isCoverageEnabled) {
    web3Provider.addProvider(coverage.getCoverageSubproviderSingleton());
}
web3Provider.addProvider(
    new GanacheSubprovider({
        logger: {
            log: (arg: any) => {
                fs.appendFileSync('ganache.log', `${arg}\n`);
            },
        },
        verbose: env.parseBoolean(EnvVars.SolidityCoverage),
        port: 8545,
        networkId: 50,
        mnemonic: 'concert load couple harbor equip island argue ramp clarify fence smart topic',
    }),
);
web3Provider.start();

export const web3Wrapper = new Web3Wrapper(web3Provider);
