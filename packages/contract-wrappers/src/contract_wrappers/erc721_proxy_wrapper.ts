import { ERC721ProxyContract } from '@0x/abi-gen-wrappers';
import { ERC721Proxy } from '@0x/contract-artifacts';
import { AssetProxyId } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ContractAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { assert } from '../utils/assert';
import { _getDefaultContractAddresses } from '../utils/contract_addresses';

import { ContractWrapper } from './contract_wrapper';

/**
 * This class includes the functionality related to interacting with the ERC721Proxy contract.
 */
export class ERC721ProxyWrapper extends ContractWrapper {
    public abi: ContractAbi = ERC721Proxy.compilerOutput.abi;
    public address: string;
    private _erc721ProxyContractIfExists?: ERC721ProxyContract;
    /**
     * Instantiate ERC721ProxyWrapper
     * @param web3Wrapper Web3Wrapper instance to use
     * @param networkId Desired networkId
     * @param address The address of the ERC721Proxy contract. If undefined,
     * will default to the known address corresponding to the networkId.
     */
    constructor(web3Wrapper: Web3Wrapper, networkId: number, address?: string) {
        super(web3Wrapper, networkId);
        this.address = _.isUndefined(address) ? _getDefaultContractAddresses(networkId).erc721Proxy : address;
    }
    /**
     * Get the 4 bytes ID of this asset proxy
     * @return  Proxy id
     */
    public async getProxyIdAsync(): Promise<AssetProxyId> {
        const ERC721ProxyContractInstance = await this._getERC721ProxyContract();
        // Note(albrow): Below is a TSLint false positive. Code won't compile if
        // you remove the type assertion.
        /* tslint:disable-next-line:no-unnecessary-type-assertion */
        const proxyId = (await ERC721ProxyContractInstance.getProxyId.callAsync()) as AssetProxyId;
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
        const ERC721ProxyContractInstance = await this._getERC721ProxyContract();
        const isAuthorized = await ERC721ProxyContractInstance.authorized.callAsync(normalizedExchangeContractAddress);
        return isAuthorized;
    }
    /**
     * Get the list of all Exchange contract addresses authorized by the ERC721Proxy contract.
     * @return  The list of authorized addresses.
     */
    public async getAuthorizedAddressesAsync(): Promise<string[]> {
        const ERC721ProxyContractInstance = await this._getERC721ProxyContract();
        const authorizedAddresses = await ERC721ProxyContractInstance.getAuthorizedAddresses.callAsync();
        return authorizedAddresses;
    }
    private _getERC721ProxyContract(): ERC721ProxyContract {
        if (!_.isUndefined(this._erc721ProxyContractIfExists)) {
            return this._erc721ProxyContractIfExists;
        }
        const contractInstance = new ERC721ProxyContract(
            this.abi,
            this.address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._erc721ProxyContractIfExists = contractInstance;
        return this._erc721ProxyContractIfExists;
    }
}
