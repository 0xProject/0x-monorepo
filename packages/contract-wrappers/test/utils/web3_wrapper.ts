import { devConstants, web3Factory } from '@0xproject/dev-utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';

const txDefaults = {
    from: devConstants.TESTRPC_FIRST_ADDRESS,
    gasLimit: devConstants.GAS_LIMIT,
};
const provider: Provider = web3Factory.getRpcProvider({ shouldUseInProcessGanache: true });
const web3Wrapper = new Web3Wrapper(provider);

export { provider, web3Wrapper, txDefaults };
