import { devConstants, web3Factory } from '@0xproject/dev-utils';
import { Provider } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';

export const txDefaults = {
    from: devConstants.TESTRPC_FIRST_ADDRESS,
    gas: devConstants.GAS_ESTIMATE,
};
const providerConfigs = {
    shouldUseInProcessGanache: false,
    rpcUrl: 'http://localhost:8501',
};
export const web3 = web3Factory.create(providerConfigs);
export const provider = web3.currentProvider;
export const web3Wrapper = new Web3Wrapper(provider);
