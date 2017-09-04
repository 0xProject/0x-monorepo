import * as _ from 'lodash';
import * as Web3 from 'web3';
import {Web3Wrapper} from '../web3_wrapper';
import {ZeroExError} from '../types';
import {utils} from '../utils/utils';

export class ContractWrapper {
    protected _web3Wrapper: Web3Wrapper;
    private _gasPrice?: BigNumber.BigNumber;
    constructor(web3Wrapper: Web3Wrapper, gasPrice?: BigNumber.BigNumber) {
        this._web3Wrapper = web3Wrapper;
        this._gasPrice = gasPrice;
    }
    protected async _instantiateContractIfExistsAsync<A extends Web3.ContractInstance>(artifact: Artifact,
                                                                                       address?: string): Promise<A> {
        const contractInstance =
            await this._web3Wrapper.getContractInstanceFromArtifactAsync<A>(artifact, address);
        return contractInstance;
    }
}
