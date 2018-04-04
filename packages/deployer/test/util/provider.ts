import { web3Factory } from '@0xproject/dev-utils';
import * as Web3 from 'web3';

const web3ProviderConfig = { shouldUseInProcessGanache: true };
const web3Instance = web3Factory.create(web3ProviderConfig);
export const provider = web3Instance.currentProvider;
