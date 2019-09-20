import { web3Factory } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { Web3Wrapper } from '@0x/web3-wrapper';

const provider: Web3ProviderEngine = web3Factory.getRpcProvider({ shouldUseInProcessGanache: true });
const web3Wrapper = new Web3Wrapper(provider);

export { provider, web3Wrapper };
