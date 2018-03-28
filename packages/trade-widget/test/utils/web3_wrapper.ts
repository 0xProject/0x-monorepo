import { web3Factory } from '@0xproject/dev-utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';

const web3ProviderConfig = { shouldUseInProcessGanache: true };
export const web3 = web3Factory.create(web3ProviderConfig);
export const web3Wrapper = new Web3Wrapper(web3.currentProvider);
