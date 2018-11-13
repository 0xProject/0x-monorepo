import { ContractAddresses, getContractAddressesForNetworkOrThrow, NetworkId } from '@0x/contract-addresses';
import * as _ from 'lodash';

/**
 * Returns the default contract addresses for the given networkId or throws with
 * a context-specific error message if the networkId is not recognized.
 */
export function _getDefaultContractAddresses(networkId: number): ContractAddresses {
    if (!(networkId in NetworkId)) {
        throw new Error(
            `No default contract addresses found for the given network id (${networkId}). If you want to use ContractWrappers on this network, you must manually pass in the contract address(es) to the constructor.`,
        );
    }
    return getContractAddressesForNetworkOrThrow(networkId);
}
