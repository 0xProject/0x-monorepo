import { web3Factory } from '@0xproject/dev-utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';

export const web3 = web3Factory.create();
export const web3Wrapper = new Web3Wrapper(web3.currentProvider);
