import * as _ from 'lodash';
import contract = require('truffle-contract');
import {Web3Wrapper} from '../web3_wrapper';
import {ZeroExError} from '../types';
import {utils} from '../utils/utils';

export class ContractWrapper {
    protected web3Wrapper: Web3Wrapper;
    constructor(web3Wrapper: Web3Wrapper) {
        this.web3Wrapper = web3Wrapper;
    }
    protected async _instantiateContractIfExistsAsync(artifact: Artifact, address?: string): Promise<ContractInstance> {
        const c = await contract(artifact);
        const providerObj = this.web3Wrapper.getCurrentProvider();
        c.setProvider(providerObj);

        const networkIdIfExists = await this.web3Wrapper.getNetworkIdIfExistsAsync();
        const artifactNetworkConfigs = _.isUndefined(networkIdIfExists) ?
                                       undefined :
                                       artifact.networks[networkIdIfExists];
        let contractAddress;
        if (!_.isUndefined(address)) {
            contractAddress = address;
        } else if (!_.isUndefined(artifactNetworkConfigs)) {
            contractAddress = artifactNetworkConfigs.address;
        }

        if (!_.isUndefined(contractAddress)) {
            const doesContractExist = await this.web3Wrapper.doesContractExistAtAddressAsync(contractAddress);
            if (!doesContractExist) {
                throw new Error(ZeroExError.CONTRACT_DOES_NOT_EXIST);
            }
        }

        try {
            const contractInstance = _.isUndefined(address) ? await c.deployed() : await c.at(address);
            return contractInstance;
        } catch (err) {
            const errMsg = `${err}`;
            if (_.includes(errMsg, 'not been deployed to detected network')) {
                throw new Error(ZeroExError.CONTRACT_DOES_NOT_EXIST);
            } else {
                utils.consoleLog(`Notice: Error encountered: ${err} ${err.stack}`);
                throw new Error(ZeroExError.UNHANDLED_ERROR);
            }
        }
    }
}
