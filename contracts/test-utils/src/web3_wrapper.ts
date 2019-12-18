import { devConstants, env, EnvVars, Web3Config, web3Factory } from '@0x/dev-utils';
import { prependSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { constants } from './constants';
import { coverage } from './coverage';
import { profiler } from './profiler';
import { revertTrace } from './revert_trace';

export const txDefaults = {
    from: devConstants.TESTRPC_FIRST_ADDRESS,
    gas: devConstants.GAS_LIMIT,
    gasPrice: constants.DEFAULT_GAS_PRICE,
};

let providerConfigs: Web3Config = {
    total_accounts: constants.NUM_TEST_ACCOUNTS,
    shouldUseInProcessGanache: true,
    shouldAllowUnlimitedContractSize: true,
    //ganacheDatabasePath: '/Volumes/RamDisk',
};

if (process.env.FORK_RPC_URL !== undefined) {
    providerConfigs = {
        ...providerConfigs,
        fork: process.env.FORK_RPC_URL,
        blockTime: 0,
        // ZeroExGovernor signer addresses
        unlocked_accounts: [
            '0x257619b7155d247e43c8b6d90c8c17278ae481f0',
            '0x5ee2a00f8f01d099451844af7f894f26a57fcbf2',
            '0x894d623e0e0e8ed12c4a73dada999e275684a37d',
            '0x1916a90bafe25771485e182a96132e200daffdd1', // My account with DAI and unlocked bridge.
            '0x8ed95d1746bf1e4dab58d8ed4724f1ef95b20db0', // erc20 bridge proxy
            '0x61935cbdd02287b511119ddb11aeb42f1593b7ef', // 0x exchange v3
        ],
    };
}

export const provider: Web3ProviderEngine = web3Factory.getRpcProvider(providerConfigs);
provider.stop();
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
