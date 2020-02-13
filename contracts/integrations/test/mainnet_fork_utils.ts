import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { ContractWrappers } from '@0x/contract-wrappers';
import { Web3ProviderEngine } from '@0x/dev-utils';

const chainId = 1;
export const dydxAccountOwner = '0xfdac948232c5bfbe24b770326ee4dff7a8dd8484';
export const contractAddresses = getContractAddressesForChainOrThrow(chainId);

/**
 * Create contract wrappers for the mainnet given a mainnet/forked provider.
 */
export function getContractwrappers(provider: Web3ProviderEngine): ContractWrappers {
    return new ContractWrappers(provider, { chainId, contractAddresses });
}
