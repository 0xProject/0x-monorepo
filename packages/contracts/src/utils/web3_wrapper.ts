import { devConstants, env, EnvVars, web3Factory } from '@0xproject/dev-utils';
import { prependSubprovider } from '@0xproject/subproviders';
import { Web3Wrapper } from '@0xproject/web3-wrapper';

import { coverage } from './coverage';

export const txDefaults = {
    from: devConstants.TESTRPC_FIRST_ADDRESS,
    gas: devConstants.GAS_LIMIT,
};
const providerConfigs = { shouldUseInProcessGanache: true };
export const provider = web3Factory.getRpcProvider(providerConfigs);
const isCoverageEnabled = env.parseBoolean(EnvVars.SolidityCoverage);
if (isCoverageEnabled) {
    const coverageSubprovider = coverage.getCoverageSubproviderSingleton();
    prependSubprovider(provider, coverageSubprovider);
}
export const web3Wrapper = new Web3Wrapper(provider);
