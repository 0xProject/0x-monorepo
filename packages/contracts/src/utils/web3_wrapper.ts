import { devConstants, env, EnvVars, web3Factory } from '@0xproject/dev-utils';
import { prependSubprovider } from '@0xproject/subproviders';
import { logUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';

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

const ganacheTxDefaults = {
    from: devConstants.TESTRPC_FIRST_ADDRESS,
    gas: devConstants.GAS_LIMIT,
};
const gethTxDefaults = {
    from: devConstants.TESTRPC_FIRST_ADDRESS,
};
export const txDefaults = testProvider === ProviderType.Ganache ? ganacheTxDefaults : gethTxDefaults;

const gethConfigs = {
    shouldUseInProcessGanache: false,
    rpcUrl: 'http://localhost:8501',
    shouldUseFakeGasEstimate: false,
};
const ganacheConfigs = {
    shouldUseInProcessGanache: true,
};
const providerConfigs = testProvider === ProviderType.Ganache ? ganacheConfigs : gethConfigs;

export const provider = web3Factory.getRpcProvider(providerConfigs);
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
            "Gas costs in Ganache traces are incorrect and we don't recommend using it for profiling. Please switch to Geth",
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
