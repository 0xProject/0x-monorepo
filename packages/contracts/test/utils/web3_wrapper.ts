import { devConstants, env, EnvVars, web3Factory } from '@0x/dev-utils';
import { prependSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { coverage } from './coverage';
import { profiler } from './profiler';
import { revertTrace } from './revert_trace';

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

export const provider: Web3ProviderEngine = web3Factory.getRpcProvider(providerConfigs);
const isCoverageEnabled = env.parseBoolean(EnvVars.SolidityCoverage);
const isProfilerEnabled = env.parseBoolean(EnvVars.SolidityProfiler);
const isRevertTraceEnabled = env.parseBoolean(EnvVars.SolidityRevertTrace);
const enabledSubproviderCount = _.filter(
    [isCoverageEnabled, isProfilerEnabled, isRevertTraceEnabled],
    _.identity.bind(_),
).length;
if (enabledSubproviderCount > 1) {
    throw new Error(`Only one of coverage, profiler, or revert trace subproviders can be enabled at a time`);
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
if (isRevertTraceEnabled) {
    const revertTraceSubprovider = revertTrace.getRevertTraceSubproviderSingleton();
    prependSubprovider(provider, revertTraceSubprovider);
}

export const web3Wrapper = new Web3Wrapper(provider);
