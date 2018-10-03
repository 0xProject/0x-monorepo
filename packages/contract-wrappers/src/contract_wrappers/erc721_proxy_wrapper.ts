import { artifacts, wrappers } from '@0xproject/contracts';
import { AssetProxyId } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { ContractAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { assert } from '../utils/assert';

import { ContractWrapper } from './contract_wrapper';

/**
 * This class includes the functionality related to interacting with the ERC721Proxy contract.
 */
export class ERC721ProxyWrapper extends ContractWrapper {
    public abi: ContractAbi = artifacts.ERC20Proxy.compilerOutput.abi;
    public address: string;
    private _erc721ProxyContractIfExists?: wrappers.ERC721ProxyContract;
    /**
     * Instantiate ERC721ProxyWrapper
     * @param web3Wrapper Web3Wrapper instance to use
     * @param address The address of the ERC721Proxy contract
     */
    // TODO(albrow): Make address optional and default to looking up the address
    // based in a hard-coded mapping based on web3Wrapper network id.
    constructor(web3Wrapper: Web3Wrapper, address: string) {
        super(web3Wrapper);
        this.address = address;
    }
    /**
     * Get the 4 bytes ID of this asset proxy
     * @return  Proxy id
     */
    public async getProxyIdAsync(): Promise<AssetProxyId> {
        const ERC721ProxyContractInstance = await this._getERC721ProxyContract();
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
    // HACK: We don't want this method to be visible to the other units within that package but not to the end user.
    // TS doesn't give that possibility and therefore we make it private and access it over an any cast. Because of that tslint sees it as unused.
    // tslint:disable-next-line:no-unused-variable
    private _invalidateContractInstance(): void {
        delete this._erc721ProxyContractIfExists;
    }
    private _getERC721ProxyContract(): wrappers.ERC721ProxyContract {
        if (!_.isUndefined(this._erc721ProxyContractIfExists)) {
            return this._erc721ProxyContractIfExists;
        }
        const contractInstance = new wrappers.ERC721ProxyContract(
            this.abi,
            this.address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._erc721ProxyContractIfExists = contractInstance;
        return this._erc721ProxyContractIfExists;
    }
}
