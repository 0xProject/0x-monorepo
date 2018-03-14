import { AbiDecoder, intervalUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { Artifact } from '../types';

const CONTRACT_NAME_TO_NOT_FOUND_ERROR: {
    [contractName: string]: string;
} = {
    Forwarder: 'FORWARDER_CONTRACT_DOES_NOT_EXIST',
};

export class ContractWrapper {
    protected _web3Wrapper: Web3Wrapper;
    protected _networkId: number;
    private _abiDecoder?: AbiDecoder;
    constructor(web3Wrapper: Web3Wrapper, networkId: number, abiDecoder?: AbiDecoder) {
        this._web3Wrapper = web3Wrapper;
        this._networkId = networkId;
        this._abiDecoder = abiDecoder;
    }
    protected async _instantiateContractIfExistsAsync(
        artifact: Artifact,
        addressIfExists?: string,
    ): Promise<Web3.ContractInstance> {
        let contractAddress: string;
        if (_.isUndefined(addressIfExists)) {
            if (_.isUndefined(artifact.networks[this._networkId])) {
                throw new Error('ContractNotDeployedOnNetwork');
            }
            contractAddress = artifact.networks[this._networkId].address.toLowerCase();
        } else {
            contractAddress = addressIfExists;
        }
        const doesContractExist = await this._web3Wrapper.doesContractExistAtAddressAsync(contractAddress);
        if (!doesContractExist) {
            throw new Error(CONTRACT_NAME_TO_NOT_FOUND_ERROR[artifact.contract_name]);
        }

        // const contractInstance = this._web3Wrapper.getContractInstance(
        //     artifact.networks[this._networkId].abi,
        //     contractAddress,
        // );
        // return contractInstance;
        return null;
    }
    protected async _getContractAbiAndAddressFromArtifactsAsync(
        artifact: Artifact,
        addressIfExists?: string,
    ): Promise<[Web3.ContractAbi, string]> {
        let contractAddress: string;
        if (_.isUndefined(addressIfExists)) {
            if (_.isUndefined(artifact.networks[this._networkId])) {
                throw new Error('Contract not deployed on network');
            }
            contractAddress = artifact.networks[this._networkId].address.toLowerCase();
        } else {
            contractAddress = addressIfExists;
        }
        const doesContractExist = await this._web3Wrapper.doesContractExistAtAddressAsync(contractAddress);
        if (!doesContractExist) {
            throw new Error(CONTRACT_NAME_TO_NOT_FOUND_ERROR[artifact.contract_name]);
        }
        const abiAndAddress: [Web3.ContractAbi, string] = [artifact.networks[this._networkId].abi, contractAddress];
        return abiAndAddress;
    }
    protected _getContractAddress(artifact: Artifact, addressIfExists?: string): string {
        if (_.isUndefined(addressIfExists)) {
            const contractAddress = artifact.networks[this._networkId].address;
            if (_.isUndefined(contractAddress)) {
                throw new Error('ContractDoesNotExist');
            }
            return contractAddress;
        } else {
            return addressIfExists;
        }
    }
    private _setNetworkId(networkId: number): void {
        this._networkId = networkId;
    }
}
