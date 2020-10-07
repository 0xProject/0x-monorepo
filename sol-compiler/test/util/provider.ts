import { web3Factory } from '@0x/dev-utils';
import Web3ProviderEngine = require('web3-provider-engine');

const providerConfigs = { shouldUseInProcessGanache: true };
const provider: Web3ProviderEngine = web3Factory.getRpcProvider(providerConfigs);

export { provider };
