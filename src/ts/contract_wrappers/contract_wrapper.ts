import * as _ from 'lodash';
import {Web3Wrapper} from '../web3_wrapper';
import {ZeroExError} from '../types';
import {utils} from '../utils/utils';

export class ContractWrapper {
    public web3Wrapper: Web3Wrapper;
    constructor(web3Wrapper: Web3Wrapper) {
        this.web3Wrapper = web3Wrapper;
    }
    // this.exchange = await this.instantiateContractIfExistsAsync(ExchangeArtifacts);
    protected async instantiateContractIfExistsAsync(artifact: Artifact, address?: string): Promise<ContractInstance> {
        const c = await contract(artifact);
        const providerObj = this.web3Wrapper.getCurrentProvider();
        c.setProvider(providerObj);

        const networkId = await this.web3Wrapper.getNetworkIdIfExistsAsync();
        const artifactNetworkConfigs = _.isUndefined(networkId) ? undefined : artifact.networks[networkId];
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
            let contractInstance;
            if (_.isUndefined(address)) {
                contractInstance = await c.deployed();
            } else {
                contractInstance = await c.at(address);
            }
            return contractInstance;
        } catch (err) {
            const errMsg = `${err}`;
            utils.consoleLog(`Notice: Error encountered: ${err} ${err.stack}`);
            if (_.includes(errMsg, 'not been deployed to detected network')) {
                throw new Error(ZeroExError.CONTRACT_DOES_NOT_EXIST);
            } else {
                throw new Error(ZeroExError.UNHANDLED_ERROR);
            }
        }
    }
}
