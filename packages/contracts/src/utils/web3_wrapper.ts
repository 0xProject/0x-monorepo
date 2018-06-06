import { devConstants, env, EnvVars, web3Factory } from '@0xproject/dev-utils';
import { prependSubprovider } from '@0xproject/subproviders';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';

import { coverage } from './coverage';

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
if (isCoverageEnabled) {
    const coverageSubprovider = coverage.getCoverageSubproviderSingleton();
    prependSubprovider(provider, coverageSubprovider);
}

export const web3Wrapper = new Web3Wrapper(provider);
