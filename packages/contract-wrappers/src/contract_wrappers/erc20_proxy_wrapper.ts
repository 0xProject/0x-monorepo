import { ERC20ProxyContract } from '@0x/abi-gen-wrappers';
import { ERC20Proxy } from '@0x/contract-artifacts';
import { AssetProxyId } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
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
    public bytecode: string = ERC20Proxy.compilerOutput.evm.bytecode.object;
    public address: string;
    private _erc20ProxyContractIfExists?: ERC20ProxyContract;
    /**
     * Instantiate ERC20ProxyWrapper
     * @param web3Wrapper Web3Wrapper instance to use
     * @param networkId Desired networkId
     * @param address The address of the ERC20Proxy contract. If undefined, will
     * default to the known address corresponding to the networkId.
     */
    constructor(web3Wrapper: Web3Wrapper, networkId: number, address?: string) {
        super(web3Wrapper, networkId);
        this.address = address === undefined ? _getDefaultContractAddresses(networkId).erc20Proxy : address;
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
        if (this._erc20ProxyContractIfExists !== undefined) {
            return this._erc20ProxyContractIfExists;
        }
        const contractInstance = new ERC20ProxyContract(
            this.abi,
            this.bytecode,
            this.address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._erc20ProxyContractIfExists = contractInstance;
        return this._erc20ProxyContractIfExists;
    }
}
