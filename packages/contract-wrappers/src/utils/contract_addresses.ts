import { ChainId, ContractAddresses, getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import * as _ from 'lodash';

/**
 * Returns the default contract addresses for the given chainId or throws with
 * a context-specific error message if the chainId is not recognized.
 */
export function _getDefaultContractAddresses(chainId: number): ContractAddresses {
    if (!(chainId in ChainId)) {
        throw new Error(
            `No default contract addresses found for the given chain id (${chainId}). If you want to use ContractWrappers on this chain, you must manually pass in the contract address(es) to the constructor.`,
        );
    }
    return getContractAddressesForChainOrThrow(chainId);
}
