import {
    AssetProxyOwner,
    ERC20Proxy,
    ERC721Proxy,
    Exchange,
    Forwarder,
    OrderValidator,
    WETH9,
    ZRXToken,
} from '@0x/contract-artifacts';
import { ContractArtifact } from 'ethereum-types';
import * as _ from 'lodash';

export interface ContractAddresses {
    erc20Proxy: string;
    erc721Proxy: string;
    zrxToken: string;
    etherToken: string;
    exchange: string;
    assetProxyOwner: string;
    forwarder: string;
    orderValidator: string;
}

export enum NetworkId {
    Mainnet = 1,
    Ropsten = 3,
    Kovan = 42,
}

const networkToAddresses: { [networkId: number]: ContractAddresses } = {
    1: {
        erc20Proxy: (ERC20Proxy as ContractArtifact).networks[NetworkId.Mainnet].address,
        erc721Proxy: (ERC721Proxy as ContractArtifact).networks[NetworkId.Mainnet].address,
        zrxToken: (ZRXToken as ContractArtifact).networks[NetworkId.Mainnet].address,
        etherToken: (WETH9 as ContractArtifact).networks[NetworkId.Mainnet].address,
        exchange: (Exchange as ContractArtifact).networks[NetworkId.Mainnet].address,
        assetProxyOwner: (AssetProxyOwner as ContractArtifact).networks[NetworkId.Mainnet].address,
        forwarder: (Forwarder as ContractArtifact).networks[NetworkId.Mainnet].address,
        orderValidator: (OrderValidator as ContractArtifact).networks[NetworkId.Mainnet].address,
    },
    3: {
        erc20Proxy: (ERC20Proxy as ContractArtifact).networks[NetworkId.Ropsten].address,
        erc721Proxy: (ERC721Proxy as ContractArtifact).networks[NetworkId.Ropsten].address,
        zrxToken: (ZRXToken as ContractArtifact).networks[NetworkId.Ropsten].address,
        etherToken: (WETH9 as ContractArtifact).networks[NetworkId.Ropsten].address,
        exchange: (Exchange as ContractArtifact).networks[NetworkId.Ropsten].address,
        assetProxyOwner: (AssetProxyOwner as ContractArtifact).networks[NetworkId.Ropsten].address,
        forwarder: (Forwarder as ContractArtifact).networks[NetworkId.Ropsten].address,
        orderValidator: (OrderValidator as ContractArtifact).networks[NetworkId.Ropsten].address,
    },
    42: {
        erc20Proxy: (ERC20Proxy as ContractArtifact).networks[NetworkId.Kovan].address,
        erc721Proxy: (ERC721Proxy as ContractArtifact).networks[NetworkId.Kovan].address,
        zrxToken: (ZRXToken as ContractArtifact).networks[NetworkId.Kovan].address,
        etherToken: (WETH9 as ContractArtifact).networks[NetworkId.Kovan].address,
        exchange: (Exchange as ContractArtifact).networks[NetworkId.Kovan].address,
        assetProxyOwner: (AssetProxyOwner as ContractArtifact).networks[NetworkId.Kovan].address,
        forwarder: (Forwarder as ContractArtifact).networks[NetworkId.Kovan].address,
        orderValidator: (OrderValidator as ContractArtifact).networks[NetworkId.Kovan].address,
    },
};

/**
 * Used to get addresses of contracts that have been deployed to either the
 * Ethereum mainnet or a supported testnet. Throws if there are no known
 * contracts deployed on the corresponding network.
 * @param networkId The desired networkId.
 * @returns The set of addresses for contracts which have been deployed on the
 * given networkId.
 */
export function getContractAddressesForNetworkOrThrow(networkId: NetworkId): ContractAddresses {
    if (_.isUndefined(networkToAddresses[networkId])) {
        throw new Error(`Unknown network id (${networkId}). No known 0x contracts have been deployed on this network.`);
    }
    return networkToAddresses[networkId];
}
