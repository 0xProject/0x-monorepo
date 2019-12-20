import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { ContractWrappers } from '@0x/contract-wrappers';
import { Web3ProviderEngine } from '@0x/dev-utils';

const chainId = 1;
export const dydxAccountOwner = '0xeb58c2caa96f39626dcceb74fdbb7a9a8b54ec18';
export const contractAddresses = getContractAddressesForChainOrThrow(chainId);

/**
 * Create contract wrappers for the mainnet given a mainnet/forked provider.
 */
export function getContractwrappers(provider: Web3ProviderEngine): ContractWrappers {
    return new ContractWrappers(provider, { chainId, contractAddresses });
}
