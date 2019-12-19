import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { ContractWrappers } from '@0x/contract-wrappers';
import { provider } from '@0x/contracts-test-utils';

const chainId = 1;
const contractAddresses = getContractAddressesForChainOrThrow(chainId);
const contractWrappers = new ContractWrappers(provider, { chainId, contractAddresses });
const dydxAccountOwner = '0xeb58c2caa96f39626dcceb74fdbb7a9a8b54ec18';

export { contractAddresses, contractWrappers, dydxAccountOwner };
