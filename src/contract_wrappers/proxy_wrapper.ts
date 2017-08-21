import * as _ from 'lodash';
import {ContractWrapper} from './contract_wrapper';
import * as TokenTransferProxyArtifacts from '../artifacts/TokenTransferProxy.json';
import {ProxyContract} from '../types';

/**
 * This class includes the functionality related to interacting with the Proxy contract.
 */
export class ProxyWrapper extends ContractWrapper {
    private _proxyContractIfExists?: ProxyContract;
    /**
     * Check if the Exchange contract address is authorized by the Proxy contract.
     * @param   exchangeContractAddress     The hex encoded address of the Exchange contract to call.
     * @return  Whether the exchangeContractAddress is authorized.
     */
    public async isAuthorizedAsync(exchangeContractAddress: string): Promise<boolean> {
        const proxyContractInstance = await this._getProxyContractAsync();
        const isAuthorized = await proxyContractInstance.authorized.call(exchangeContractAddress);
        return isAuthorized;
    }
    /**
     * Get the list of all Exchange contract addresses authorized by the Proxy contract.
     * @return  The list of authorized addresses.
     */
    public async getAuthorizedAddressesAsync(): Promise<string[]> {
        const proxyContractInstance = await this._getProxyContractAsync();
        const authorizedAddresses = await proxyContractInstance.getAuthorizedAddresses.call();
        return authorizedAddresses;
    }
    private _invalidateContractInstance(): void {
        delete this._proxyContractIfExists;
    }
    private async _getProxyContractAsync(): Promise<ProxyContract> {
        if (!_.isUndefined(this._proxyContractIfExists)) {
            return this._proxyContractIfExists;
        }
        const contractInstance = await this._instantiateContractIfExistsAsync((TokenTransferProxyArtifacts as any));
        this._proxyContractIfExists = contractInstance as ProxyContract;
        return this._proxyContractIfExists;
    }
}
