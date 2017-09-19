import * as _ from 'lodash';
import * as Web3 from 'web3';
import {Web3Wrapper} from '../web3_wrapper';
import {ZeroExError, Artifact} from '../types';
import {utils} from '../utils/utils';

export class ContractWrapper {
    protected _web3Wrapper: Web3Wrapper;
    constructor(web3Wrapper: Web3Wrapper) {
        this._web3Wrapper = web3Wrapper;
    }
    protected async _instantiateContractIfExistsAsync<A extends Web3.ContractInstance>(artifact: Artifact,
                                                                                       addressIfExists?: string,
                                                                                      ): Promise<A> {
        const contractInstance =
            await this._web3Wrapper.getContractInstanceFromArtifactAsync<A>(artifact, addressIfExists);
        return contractInstance;
    }
}
