import { env, EnvVars } from '@0xproject/dev-utils';
import { GanacheSubprovider } from '@0xproject/subproviders';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as fs from 'fs';
import * as _ from 'lodash';
import ProviderEngine = require('web3-provider-engine');

import { config } from './config';
import { coverage } from './coverage';

export const provider = new ProviderEngine();
const isCoverageEnabled = env.parseBoolean(EnvVars.SolidityCoverage);
if (isCoverageEnabled) {
    provider.addProvider(coverage.getCoverageSubproviderSingleton());
}
provider.addProvider(
    new GanacheSubprovider({
        logger: {
            log: (arg: any) => {
                fs.appendFileSync(config.ganacheLogFile, `${arg}\n`);
            },
        },
        verbose: env.parseBoolean(EnvVars.SolidityCoverage),
        networkId: config.networkId,
        mnemonic: config.mnemonic,
    }),
);
provider.start();

export const web3Wrapper = new Web3Wrapper(provider);
