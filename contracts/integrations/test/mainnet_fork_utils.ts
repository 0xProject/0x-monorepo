import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { ContractWrappers } from '@0x/contract-wrappers';
import { provider } from '@0x/contracts-test-utils';

const chainId = 1;
const contractAddresses = getContractAddressesForChainOrThrow(chainId);
const contractWrappers = new ContractWrappers(provider, { chainId, contractAddresses });

export { contractAddresses, contractWrappers };
