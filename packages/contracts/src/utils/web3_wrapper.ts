import { devConstants, env, EnvVars, web3Factory } from '@0xproject/dev-utils';
import { prependSubprovider } from '@0xproject/subproviders';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';

import { coverage } from './coverage';

const testProvider = process.env.TEST_PROVIDER || 'ganache';

const ganacheTxDefaults = {
    from: devConstants.TESTRPC_FIRST_ADDRESS,
    gas: devConstants.GAS_LIMIT,
};
const gethTxDefaults = {
    from: devConstants.TESTRPC_FIRST_ADDRESS,
};
export const txDefaults = testProvider === 'ganache' ? ganacheTxDefaults : gethTxDefaults;

const gethConfigs = {
    shouldUseInProcessGanache: false,
    rpcUrl: 'http://localhost:8501',
    shouldUseFakeGasEstimate: false,
};
const ganacheConfigs = {
    shouldUseInProcessGanache: true,
};

const providerConfigs = testProvider === 'ganache' ? ganacheConfigs : gethConfigs;

export const provider = web3Factory.getRpcProvider(providerConfigs);
const isCoverageEnabled = env.parseBoolean(EnvVars.SolidityCoverage);
if (isCoverageEnabled) {
    const coverageSubprovider = coverage.getCoverageSubproviderSingleton();
    prependSubprovider(provider, coverageSubprovider);
}

export const web3Wrapper = new Web3Wrapper(provider);
