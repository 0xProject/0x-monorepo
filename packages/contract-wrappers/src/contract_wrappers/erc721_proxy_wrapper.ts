import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { ContractAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from '../artifacts';
import { assert } from '../utils/assert';

import { ContractWrapper } from './contract_wrapper';
import { ERC721ProxyContract } from './generated/erc721_proxy';

/**
 * This class includes the functionality related to interacting with the ERC721Proxy contract.
 */
export class ERC721ProxyWrapper extends ContractWrapper {
    public abi: ContractAbi = artifacts.ERC20Proxy.compilerOutput.abi;
    private _erc721ProxyContractIfExists?: ERC721ProxyContract;
    private _contractAddressIfExists?: string;
    constructor(web3Wrapper: Web3Wrapper, networkId: number, contractAddressIfExists?: string) {
        super(web3Wrapper, networkId);
        this._contractAddressIfExists = contractAddressIfExists;
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
    // tslint:disable-next-line:no-unused-variable
    private _invalidateContractInstance(): void {
        delete this._erc721ProxyContractIfExists;
    }
    private async _getERC721ProxyContractAsync(): Promise<ERC721ProxyContract> {
        if (!_.isUndefined(this._erc721ProxyContractIfExists)) {
            return this._erc721ProxyContractIfExists;
        }
        const [abi, address] = await this._getContractAbiAndAddressFromArtifactsAsync(
            artifacts.ERC721Proxy,
            this._contractAddressIfExists,
        );
        const contractInstance = new ERC721ProxyContract(
            abi,
            address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._erc721ProxyContractIfExists = contractInstance;
        return this._erc721ProxyContractIfExists;
    }
}
