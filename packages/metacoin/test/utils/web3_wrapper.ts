import { devConstants, env, EnvVars } from '@0xproject/dev-utils';
import { GanacheSubprovider, prependSubprovider } from '@0xproject/subproviders';
import { logUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as fs from 'fs';
import ProviderEngine = require('web3-provider-engine');
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

import { config } from './config';
import { coverage } from './coverage';
import { profiler } from './profiler';

enum ProviderType {
    Ganache = 'ganache',
    Geth = 'geth',
}

let testProvider: ProviderType;
switch (process.env.TEST_PROVIDER) {
    case undefined:
        testProvider = ProviderType.Ganache;
        break;
    case 'ganache':
        testProvider = ProviderType.Ganache;
        break;
    case 'geth':
        testProvider = ProviderType.Geth;
        break;
    default:
        throw new Error(`Unknown TEST_PROVIDER: ${process.env.TEST_PROVIDER}`);
}

export const provider = new ProviderEngine();
if (testProvider === ProviderType.Ganache) {
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
} else {
    provider.addProvider(new RpcSubprovider({ rpcUrl: 'http://localhost:8501' }));
}
provider.start();

const isCoverageEnabled = env.parseBoolean(EnvVars.SolidityCoverage);
const isProfilerEnabled = env.parseBoolean(EnvVars.SolidityProfiler);
if (isCoverageEnabled && isProfilerEnabled) {
    throw new Error(
        `Unfortunately for now you can't enable both coverage and profiler at the same time. They both use coverage.json file and there is no way to configure that.`,
    );
}
if (isCoverageEnabled) {
    const coverageSubprovider = coverage.getCoverageSubproviderSingleton();
    prependSubprovider(provider, coverageSubprovider);
}
if (isProfilerEnabled) {
    if (testProvider === ProviderType.Ganache) {
        logUtils.warn(
            "Gas costs in Ganache traces are incorrect and we don't recommend using it for profiling. Please switch to Geth. Check README for more details",
        );
        process.exit(1);
    }
    const profilerSubprovider = profiler.getProfilerSubproviderSingleton();
    logUtils.log(
        "By default profilerSubprovider is stopped so that you don't get noise from setup code. Don't forget to start it before the code you want to profile and stop it afterwards",
    );
    profilerSubprovider.stop();
    prependSubprovider(provider, profilerSubprovider);
}

export const web3Wrapper = new Web3Wrapper(provider);
