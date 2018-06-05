import { web3Factory } from '@0xproject/dev-utils';
import { Provider } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';

const provider: Provider = web3Factory.getRpcProvider({ shouldUseInProcessGanache: true });
const web3Wrapper = new Web3Wrapper(provider);

export { provider, web3Wrapper };
