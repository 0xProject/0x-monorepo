import { ERC20ProxyContract } from '@0x/abi-gen-wrappers';
import { ERC20Proxy } from '@0x/contract-artifacts';
import { EthRPCClient } from '@0x/eth-rpc-client';
import { AssetProxyId } from '@0x/types';
import { ContractAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { assert } from '../utils/assert';
import { _getDefaultContractAddresses } from '../utils/contract_addresses';

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
     * @param ethRPCClient EthRPCClient instance to use
     * @param networkId Desired networkId
     * @param address The address of the ERC20Proxy contract. If undefined, will
     * default to the known address corresponding to the networkId.
     */
    constructor(ethRPCClient: EthRPCClient, networkId: number, address?: string) {
        super(ethRPCClient, networkId);
        this.address = _.isUndefined(address) ? _getDefaultContractAddresses(networkId).erc20Proxy : address;
    }
    /**
     * Get the 4 bytes ID of this asset proxy
     * @return  Proxy id
     */
    public async getProxyIdAsync(): Promise<AssetProxyId> {
        const ERC20ProxyContractInstance = this._getERC20ProxyContract();
        // Note(albrow): Below is a TSLint false positive. Code won't compile if
        // you remove the type assertion.
        /* tslint:disable-next-line:no-unnecessary-type-assertion */
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
    private _getERC20ProxyContract(): ERC20ProxyContract {
        if (!_.isUndefined(this._erc20ProxyContractIfExists)) {
            return this._erc20ProxyContractIfExists;
        }
        const contractInstance = new ERC20ProxyContract(
            this.abi,
            this.address,
            this._ethRPCClient.getProvider(),
            this._ethRPCClient.getContractDefaults(),
        );
        this._erc20ProxyContractIfExists = contractInstance;
        return this._erc20ProxyContractIfExists;
    }
}
