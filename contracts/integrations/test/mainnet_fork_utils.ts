import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { ContractWrappers } from '@0x/contract-wrappers';
import { provider } from '@0x/contracts-test-utils';

const chainId = 1;
const contractAddresses = getContractAddressesForChainOrThrow(chainId);
const contractWrappers = new ContractWrappers(provider, { chainId, contractAddresses });
const dydxAccountOwner = '0xbd67dce6348dc5949a8af5888d6a2bd5dc3cb86d';

export { contractAddresses, contractWrappers, dydxAccountOwner };
