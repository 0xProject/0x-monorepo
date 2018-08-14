import { web3Factory } from '@0xproject/dev-utils';
import { Provider } from 'ethereum-types';

const providerConfigs = { shouldUseInProcessGanache: true };
const provider: Provider = web3Factory.getRpcProvider(providerConfigs);

export { provider };
