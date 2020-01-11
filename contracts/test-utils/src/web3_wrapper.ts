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

export let providerConfigs: Web3Config = {
    total_accounts: constants.NUM_TEST_ACCOUNTS,
    shouldUseInProcessGanache: true,
    shouldAllowUnlimitedContractSize: true,
    hardfork: 'istanbul',
    unlocked_accounts: ['0x6cc5f688a315f3dc28a7781717a9a798a59fda7b'],
};

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
