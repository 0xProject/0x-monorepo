import * as _ from 'lodash';
import {Web3Wrapper} from '../web3_wrapper';
import {ContractWrapper} from './contract_wrapper';
import * as ProxyArtifacts from '../artifacts/Proxy.json';
import {ProxyContract} from '../types';

/**
 * This class includes the functionality related to interacting with the Proxy contract.
 */
export class ProxyWrapper extends ContractWrapper {
    private _proxyContractIfExists?: ProxyContract;
    public invalidateContractInstance(): void {
        delete this._proxyContractIfExists;
    }
    /**
     * Check if the Exchange contract address is authorized within the Proxy contract.
     * @param   exchangeContractAddress     The hex encoded address of the Exchange contract to use.
     * @return  Whether the exchangeContractAddress is authorized.
     */
    public async isAuthorizedAsync(exchangeContractAddress: string): Promise<boolean> {
        const proxyContractInstance = await this._getTokenRegistryContractAsync();
        const isAuthorized = await proxyContractInstance.authorized.call(exchangeContractAddress);
        return isAuthorized;
    }
    private async _getTokenRegistryContractAsync(): Promise<ProxyContract> {
        if (!_.isUndefined(this._proxyContractIfExists)) {
            return this._proxyContractIfExists;
        }
        const contractInstance = await this._instantiateContractIfExistsAsync((ProxyArtifacts as any));
        this._proxyContractIfExists = contractInstance as ProxyContract;
        return this._proxyContractIfExists;
    }
}
