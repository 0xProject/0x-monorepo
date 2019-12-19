import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
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
};

if (process.env.FORK_RPC_URL !== undefined) {
    providerConfigs = {
        ...providerConfigs,
        fork: process.env.FORK_RPC_URL,
        blockTime: 0,
        unlocked_accounts: [
            // ZeroExGovernor signer addresses
            '0x257619b7155d247e43c8b6d90c8c17278ae481f0',
            '0x5ee2a00f8f01d099451844af7f894f26a57fcbf2',
            '0x894d623e0e0e8ed12c4a73dada999e275684a37d',
            // ERC20BridgeProxy
            getContractAddressesForChainOrThrow(1).erc20BridgeProxy,
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
