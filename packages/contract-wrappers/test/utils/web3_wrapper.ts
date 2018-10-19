import { devConstants, web3Factory } from '@0x/dev-utils';
import { EthRPCClient } from '@0x/eth-rpc-client';
import { Provider } from 'ethereum-types';

const txDefaults = {
    from: devConstants.TESTRPC_FIRST_ADDRESS,
    gas: devConstants.GAS_LIMIT,
};
const provider: Provider = web3Factory.getRpcProvider({ shouldUseInProcessGanache: true });
const ethRPCClient = new EthRPCClient(provider);

export { provider, ethRPCClient, txDefaults };
