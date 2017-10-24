import * as _ from 'lodash';
import {Web3Wrapper} from '../web3_wrapper';
import {ContractWrapper} from './contract_wrapper';
import {artifacts} from '../artifacts';
import {TokenTransferProxyContract} from '../types';

/**
 * This class includes the functionality related to interacting with the TokenTransferProxy contract.
 */
export class TokenTransferProxyWrapper extends ContractWrapper {
    private _tokenTransferProxyContractIfExists?: TokenTransferProxyContract;
    private _tokenTransferProxyContractAddressFetcher: () => Promise<string>;
    constructor(web3Wrapper: Web3Wrapper, tokenTransferProxyContractAddressFetcher: () => Promise<string>) {
        super(web3Wrapper);
        this._tokenTransferProxyContractAddressFetcher = tokenTransferProxyContractAddressFetcher;
    }
    /**
     * Check if the Exchange contract address is authorized by the TokenTransferProxy contract.
     * @param   exchangeContractAddress     The hex encoded address of the Exchange contract to call.
     * @return  Whether the exchangeContractAddress is authorized.
     */
    public async isAuthorizedAsync(exchangeContractAddress: string): Promise<boolean> {
        const tokenTransferProxyContractInstance = await this._getTokenTransferProxyContractAsync();
        const isAuthorized = await tokenTransferProxyContractInstance.authorized.callAsync(exchangeContractAddress);
        return isAuthorized;
    }
    /**
     * Get the list of all Exchange contract addresses authorized by the TokenTransferProxy contract.
     * @return  The list of authorized addresses.
     */
    public async getAuthorizedAddressesAsync(): Promise<string[]> {
        const tokenTransferProxyContractInstance = await this._getTokenTransferProxyContractAsync();
        const authorizedAddresses = await tokenTransferProxyContractInstance.getAuthorizedAddresses.callAsync();
        return authorizedAddresses;
    }
    /**
     * Retrieves the Ethereum address of the TokenTransferProxy contract deployed on the network
     * that the user-passed web3 provider is connected to.
     * @returns The Ethereum address of the TokenTransferProxy contract being used.
     */
    public async getContractAddressAsync(): Promise<string> {
        const proxyInstance = await this._getTokenTransferProxyContractAsync();
        const proxyAddress = proxyInstance.address;
        return proxyAddress;
    }
    private _invalidateContractInstance(): void {
        delete this._tokenTransferProxyContractIfExists;
    }
    private async _getTokenTransferProxyContractAsync(): Promise<TokenTransferProxyContract> {
        if (!_.isUndefined(this._tokenTransferProxyContractIfExists)) {
            return this._tokenTransferProxyContractIfExists;
        }
        const contractAddress = await this._tokenTransferProxyContractAddressFetcher();
        const contractInstance = await this._instantiateContractIfExistsAsync<TokenTransferProxyContract>(
            artifacts.TokenTransferProxyArtifact, contractAddress,
        );
        this._tokenTransferProxyContractIfExists = contractInstance as TokenTransferProxyContract;
        return this._tokenTransferProxyContractIfExists;
    }
}
