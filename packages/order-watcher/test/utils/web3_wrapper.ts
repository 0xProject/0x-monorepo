import { web3Factory } from '@0x/dev-utils';
import { EthRPCClient } from '@0x/eth-rpc-client';
import { Provider } from 'ethereum-types';

const provider: Provider = web3Factory.getRpcProvider({ shouldUseInProcessGanache: true });
const ethRPCClient = new EthRPCClient(provider);

export { provider, ethRPCClient };
