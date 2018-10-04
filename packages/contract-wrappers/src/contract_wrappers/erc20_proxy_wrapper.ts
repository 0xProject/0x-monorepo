import { ERC20ProxyContract } from '@0xproject/abi-gen-wrappers';
import { ERC20Proxy } from '@0xproject/contract-artifacts';
import { AssetProxyId } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { ContractAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { assert } from '../utils/assert';

import { ContractWrapper } from './contract_wrapper';

/**
 * This class includes the functionality related to interacting with the ERC20Proxy contract.
 */
export class ERC20ProxyWrapper extends ContractWrapper {
    public abi: ContractAbi = ERC20Proxy.compilerOutput.abi;
    public address: string;
    private _erc20ProxyContractIfExists?: ERC20ProxyContract;
    /**
     * Instantiate ERC20ProxyWrapper
     * @param web3Wrapper Web3Wrapper instance to use
     * @param address The address of the ERC20Proxy contract
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
        const ERC20ProxyContractInstance = this._getERC20ProxyContract();
        const proxyId = (await ERC20ProxyContractInstance.getProxyId.callAsync()) as AssetProxyId;
        return proxyId;
    }
    /**
     * Check if the Exchange contract address is authorized by the ERC20Proxy contract.
     * @param   exchangeContractAddress     The hex encoded address of the Exchange contract to call.
     * @return  Whether the exchangeContractAddress is authorized.
     */
    public async isAuthorizedAsync(exchangeContractAddress: string): Promise<boolean> {
        assert.isETHAddressHex('exchangeContractAddress', exchangeContractAddress);
        const normalizedExchangeContractAddress = exchangeContractAddress.toLowerCase();
        const ERC20ProxyContractInstance = this._getERC20ProxyContract();
        const isAuthorized = await ERC20ProxyContractInstance.authorized.callAsync(normalizedExchangeContractAddress);
        return isAuthorized;
    }
    /**
     * Get the list of all Exchange contract addresses authorized by the ERC20Proxy contract.
     * @return  The list of authorized addresses.
     */
    public async getAuthorizedAddressesAsync(): Promise<string[]> {
        const ERC20ProxyContractInstance = this._getERC20ProxyContract();
        const authorizedAddresses = await ERC20ProxyContractInstance.getAuthorizedAddresses.callAsync();
        return authorizedAddresses;
    }
    // HACK: We don't want this method to be visible to the other units within that package but not to the end user.
    // TS doesn't give that possibility and therefore we make it private and access it over an any cast. Because of that tslint sees it as unused.
    // tslint:disable-next-line:no-unused-variable
    private _invalidateContractInstance(): void {
        delete this._erc20ProxyContractIfExists;
    }
    private _getERC20ProxyContract(): ERC20ProxyContract {
        if (!_.isUndefined(this._erc20ProxyContractIfExists)) {
            return this._erc20ProxyContractIfExists;
        }
        const contractInstance = new ERC20ProxyContract(
            this.abi,
            this.address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._erc20ProxyContractIfExists = contractInstance;
        return this._erc20ProxyContractIfExists;
    }
}
