import { devConstants, web3Factory } from '@0xproject/dev-utils';
import { Provider } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';

const web3 = web3Factory.create({ shouldUseInProcessGanache: true });
const provider: Provider = web3.currentProvider;
const web3Wrapper = new Web3Wrapper(web3.currentProvider);

export { provider, web3Wrapper };
