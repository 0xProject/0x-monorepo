import { web3Factory } from '@0xproject/dev-utils';
import { Provider } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';

const providerConfigs = { shouldUseInProcessGanache: true };
export const web3 = web3Factory.create(providerConfigs);
export const provider = web3.currentProvider;
export const web3Wrapper = new Web3Wrapper(provider);
