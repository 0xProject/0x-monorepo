import { Web3Wrapper } from '@0x/web3-wrapper';

import { getProvider } from './provider';

export const web3Wrapper = new Web3Wrapper(getProvider());
