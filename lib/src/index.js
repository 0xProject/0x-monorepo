"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var addresses_json_1 = __importDefault(require("../addresses.json"));
var ChainId;
(function (ChainId) {
    ChainId[ChainId["Mainnet"] = 1] = "Mainnet";
    ChainId[ChainId["Ropsten"] = 3] = "Ropsten";
    ChainId[ChainId["Rinkeby"] = 4] = "Rinkeby";
    ChainId[ChainId["Kovan"] = 42] = "Kovan";
    ChainId[ChainId["Ganache"] = 1337] = "Ganache";
})(ChainId = exports.ChainId || (exports.ChainId = {}));
/**
 * Used to get addresses of contracts that have been deployed to either the
 * Ethereum mainnet or a supported testnet. Throws if there are no known
 * contracts deployed on the corresponding chain.
 * @param chainId The desired chainId.
 * @returns The set of addresses for contracts which have been deployed on the
 * given chainId.
 */
function getContractAddressesForChainOrThrow(chainId) {
    var chainToAddresses = addresses_json_1.default;
    if (chainToAddresses[chainId] === undefined) {
        throw new Error("Unknown chain id (" + chainId + "). No known 0x contracts have been deployed on this chain.");
    }
    return chainToAddresses[chainId];
}
exports.getContractAddressesForChainOrThrow = getContractAddressesForChainOrThrow;
//# sourceMappingURL=index.js.map