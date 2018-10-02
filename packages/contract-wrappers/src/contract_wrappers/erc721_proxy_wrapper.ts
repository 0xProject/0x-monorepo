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
    private _erc721ProxyContractIfExists?: wrappers.ERC721ProxyContract;
    private _contractAddressIfExists?: string;
    /**
     * Instantiate ERC721ProxyWrapper
     * @param web3Wrapper Web3Wrapper instance to use
     * @param networkId Desired networkId
     * @param contractAddressIfExists The contract address to use. This is usually pulled from
     * the artifacts but needs to be specified when using with your own custom testnet.
     */
    constructor(web3Wrapper: Web3Wrapper, networkId: number, contractAddressIfExists?: string) {
        super(web3Wrapper, networkId);
        this._contractAddressIfExists = contractAddressIfExists;
    }
    /**
     * Get the 4 bytes ID of this asset proxy
     * @return  Proxy id
     */
    public async getProxyIdAsync(): Promise<AssetProxyId> {
        const ERC721ProxyContractInstance = await this._getERC721ProxyContractAsync();
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
        const ERC721ProxyContractInstance = await this._getERC721ProxyContractAsync();
        const isAuthorized = await ERC721ProxyContractInstance.authorized.callAsync(normalizedExchangeContractAddress);
        return isAuthorized;
    }
    /**
     * Get the list of all Exchange contract addresses authorized by the ERC721Proxy contract.
     * @return  The list of authorized addresses.
     */
    public async getAuthorizedAddressesAsync(): Promise<string[]> {
        const ERC721ProxyContractInstance = await this._getERC721ProxyContractAsync();
        const authorizedAddresses = await ERC721ProxyContractInstance.getAuthorizedAddresses.callAsync();
        return authorizedAddresses;
    }
    /**
     * Retrieves the Ethereum address of the ERC721Proxy contract deployed on the network
     * that the user-passed web3 provider is connected to.
     * @returns The Ethereum address of the ERC721Proxy contract being used.
     */
    public getContractAddress(): string {
        const contractAddress = this._getContractAddress(artifacts.ERC721Proxy, this._contractAddressIfExists);
        return contractAddress;
    }
    // HACK: We don't want this method to be visible to the other units within that package but not to the end user.
    // TS doesn't give that possibility and therefore we make it private and access it over an any cast. Because of that tslint sees it as unused.
    // tslint:disable-next-line:no-unused-variable
    private _invalidateContractInstance(): void {
        delete this._erc721ProxyContractIfExists;
    }
    private async _getERC721ProxyContractAsync(): Promise<wrappers.ERC721ProxyContract> {
        if (!_.isUndefined(this._erc721ProxyContractIfExists)) {
            return this._erc721ProxyContractIfExists;
        }
        const [abi, address] = await this._getContractAbiAndAddressFromArtifactsAsync(
            artifacts.ERC721Proxy,
            this._contractAddressIfExists,
        );
        const contractInstance = new wrappers.ERC721ProxyContract(
            abi,
            address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._erc721ProxyContractIfExists = contractInstance;
        return this._erc721ProxyContractIfExists;
    }
}
