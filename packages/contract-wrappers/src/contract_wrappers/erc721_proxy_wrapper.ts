import { ERC721ProxyContract } from '@0x/abi-gen-wrappers';
import { ERC721Proxy } from '@0x/contract-artifacts';
import { AssetProxyId } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ContractAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { assert } from '../utils/assert';
import { _getDefaultContractAddresses } from '../utils/contract_addresses';

/**
 * This class includes the functionality related to interacting with the ERC721Proxy contract.
 */
export class ERC721ProxyWrapper {
    public abi: ContractAbi = ERC721Proxy.compilerOutput.abi;
    public address: string;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _erc721ProxyContract: ERC721ProxyContract;
    /**
     * Instantiate ERC721ProxyWrapper
     * @param web3Wrapper Web3Wrapper instance to use
     * @param networkId Desired networkId
     * @param address The address of the ERC721Proxy contract. If undefined,
     * will default to the known address corresponding to the networkId.
     */
    constructor(web3Wrapper: Web3Wrapper, networkId: number, address?: string) {
        this._web3Wrapper = web3Wrapper;
        this.address = address === undefined ? _getDefaultContractAddresses(networkId).erc721Proxy : address;
        this._erc721ProxyContract = new ERC721ProxyContract(
            this.address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
    }
    /**
     * Get the 4 bytes ID of this asset proxy
     * @return  Proxy id
     */
    public async getProxyIdAsync(): Promise<AssetProxyId> {
        // Note(albrow): Below is a TSLint false positive. Code won't compile if
        // you remove the type assertion.
        /* tslint:disable-next-line:no-unnecessary-type-assertion */
        const proxyId = (await this._erc721ProxyContract.getProxyId.callAsync()) as AssetProxyId;
        return proxyId;
    }
    /**
     * Check if the Exchange contract address is authorized by the ERC721Proxy contract.
     * @param   exchangeContractAddress     The hex encoded address of the Exchange contract to call.
     * @return  Whether the exchangeContractAddress is authorized.
     */
    public async isAuthorizedAsync(exchangeContractAddress: string): Promise<boolean> {
        assert.isETHAddressHex('exchangeContractAddress', exchangeContractAddress);
        const normalizedExchangeContractAddress = exchangeContractAddress.toLowerCase();
        const isAuthorized = await this._erc721ProxyContract.authorized.callAsync(normalizedExchangeContractAddress);
        return isAuthorized;
    }
    /**
     * Get the list of all Exchange contract addresses authorized by the ERC721Proxy contract.
     * @return  The list of authorized addresses.
     */
    public async getAuthorizedAddressesAsync(): Promise<string[]> {
        const authorizedAddresses = await this._erc721ProxyContract.getAuthorizedAddresses.callAsync();
        return authorizedAddresses;
    }
}
