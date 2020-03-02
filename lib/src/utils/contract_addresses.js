"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var contract_addresses_1 = require("@0x/contract-addresses");
/**
 * Returns the default contract addresses for the given chainId or throws with
 * a context-specific error message if the chainId is not recognized.
 */
function _getDefaultContractAddresses(chainId) {
    if (!(chainId in contract_addresses_1.ChainId)) {
        throw new Error("No default contract addresses found for the given chain id (" + chainId + "). If you want to use ContractWrappers on this chain, you must manually pass in the contract address(es) to the constructor.");
    }
    return contract_addresses_1.getContractAddressesForChainOrThrow(chainId);
}
exports._getDefaultContractAddresses = _getDefaultContractAddresses;
//# sourceMappingURL=contract_addresses.js.map