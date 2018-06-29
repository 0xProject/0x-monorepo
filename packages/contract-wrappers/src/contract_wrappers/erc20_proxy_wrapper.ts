import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { ContractAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from '../artifacts';
import { assert } from '../utils/assert';

import { ContractWrapper } from './contract_wrapper';
import { ERC20ProxyContract } from './generated/erc20_proxy';

/**
 * This class includes the functionality related to interacting with the ERC20Proxy contract.
 */
export class ERC20ProxyWrapper extends ContractWrapper {
    public abi: ContractAbi = artifacts.ERC20Proxy.compilerOutput.abi;
    private _erc20ProxyContractIfExists?: ERC20ProxyContract;
    private _contractAddressIfExists?: string;
    constructor(web3Wrapper: Web3Wrapper, networkId: number, contractAddressIfExists?: string) {
        super(web3Wrapper, networkId);
        this._contractAddressIfExists = contractAddressIfExists;
    }
    /**
     * Check if the Exchange contract address is authorized by the ERC20Proxy contract.
     * @param   exchangeContractAddress     The hex encoded address of the Exchange contract to call.
     * @return  Whether the exchangeContractAddress is authorized.
     */
    public async isAuthorizedAsync(exchangeContractAddress: string): Promise<boolean> {
        assert.isETHAddressHex('exchangeContractAddress', exchangeContractAddress);
        const normalizedExchangeContractAddress = exchangeContractAddress.toLowerCase();
        const ERC20ProxyContractInstance = await this._getERC20ProxyContractAsync();
        const isAuthorized = await ERC20ProxyContractInstance.authorized.callAsync(normalizedExchangeContractAddress);
        return isAuthorized;
    }
    /**
     * Get the list of all Exchange contract addresses authorized by the ERC20Proxy contract.
     * @return  The list of authorized addresses.
     */
    public async getAuthorizedAddressesAsync(): Promise<string[]> {
        const ERC20ProxyContractInstance = await this._getERC20ProxyContractAsync();
        const authorizedAddresses = await ERC20ProxyContractInstance.getAuthorizedAddresses.callAsync();
        return authorizedAddresses;
    }
    /**
     * Retrieves the Ethereum address of the ERC20Proxy contract deployed on the network
     * that the user-passed web3 provider is connected to.
     * @returns The Ethereum address of the ERC20Proxy contract being used.
     */
    public getContractAddress(): string {
        const contractAddress = this._getContractAddress(artifacts.ERC20Proxy, this._contractAddressIfExists);
        return contractAddress;
    }
    // tslint:disable-next-line:no-unused-variable
    private _invalidateContractInstance(): void {
        delete this._erc20ProxyContractIfExists;
    }
    private async _getERC20ProxyContractAsync(): Promise<ERC20ProxyContract> {
        if (!_.isUndefined(this._erc20ProxyContractIfExists)) {
            return this._erc20ProxyContractIfExists;
        }
        const [abi, address] = await this._getContractAbiAndAddressFromArtifactsAsync(
            artifacts.ERC20Proxy,
            this._contractAddressIfExists,
        );
        const contractInstance = new ERC20ProxyContract(
            abi,
            address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._erc20ProxyContractIfExists = contractInstance;
        return this._erc20ProxyContractIfExists;
    }
}
