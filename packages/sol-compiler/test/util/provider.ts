import { web3Factory } from '@0xproject/dev-utils';
import { Provider } from '@0xproject/types';
import * as Web3 from 'web3';

const providerConfigs = { shouldUseInProcessGanache: true };
const provider: Provider = web3Factory.getRpcProvider(providerConfigs);

export { provider };
