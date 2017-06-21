import includes from 'lodash/includes';
import isUndefined from 'lodash/isUndefined';
import contract = require('truffle-contract');
import {Web3Wrapper} from '../web3_wrapper';
import {ZeroExError, Artifact, ContractInstance} from '../types';
import {utils} from '../utils/utils';

export class ContractWrapper {
    protected _web3Wrapper: Web3Wrapper;
    constructor(web3Wrapper: Web3Wrapper) {
        this._web3Wrapper = web3Wrapper;
    }
    protected async _instantiateContractIfExistsAsync(artifact: Artifact, address?: string): Promise<ContractInstance> {
        const c = await contract(artifact);
        const providerObj = this._web3Wrapper.getCurrentProvider();
        c.setProvider(providerObj);

        const networkIdIfExists = await this._web3Wrapper.getNetworkIdIfExistsAsync();
        const artifactNetworkConfigs = isUndefined(networkIdIfExists) ?
                                       undefined :
                                       artifact.networks[networkIdIfExists];
        let contractAddress;
        if (!isUndefined(address)) {
            contractAddress = address;
        } else if (!isUndefined(artifactNetworkConfigs)) {
            contractAddress = artifactNetworkConfigs.address;
        }

        if (!isUndefined(contractAddress)) {
            const doesContractExist = await this._web3Wrapper.doesContractExistAtAddressAsync(contractAddress);
            if (!doesContractExist) {
                throw new Error(ZeroExError.CONTRACT_DOES_NOT_EXIST);
            }
        }

        try {
            const contractInstance = isUndefined(address) ? await c.deployed() : await c.at(address);
            return contractInstance;
        } catch (err) {
            const errMsg = `${err}`;
            if (includes(errMsg, 'not been deployed to detected network')) {
                throw new Error(ZeroExError.CONTRACT_DOES_NOT_EXIST);
            } else {
                utils.consoleLog(`Notice: Error encountered: ${err} ${err.stack}`);
                throw new Error(ZeroExError.UNHANDLED_ERROR);
            }
        }
    }
}
