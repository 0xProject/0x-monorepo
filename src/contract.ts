import * as Web3 from 'web3';
import * as _ from 'lodash';
import promisify = require('es6-promisify');

export class Contract<A extends Web3.ContractInstance> implements Web3.ContractInstance {
    public address: string;
    public abi: Web3.ContractAbi;
    private contract: A;
    [name: string]: any;
    constructor(web3ContractInstance: A) {
        this.contract = web3ContractInstance;
        this.address = web3ContractInstance.address;
        this.abi = web3ContractInstance.abi;
        const functionsAbi = _.filter(this.abi, abiPart => abiPart.type === 'function');
        _.forEach(functionsAbi, (functionAbi: Web3.MethodAbi) => {
            const cbStyleFunction = web3ContractInstance[functionAbi.name];
            this[functionAbi.name] = promisify(cbStyleFunction, web3ContractInstance);
            if (functionAbi.constant) {
                const cbStyleCallFunction = web3ContractInstance[functionAbi.name].call;
                this[functionAbi.name].call = promisify(cbStyleCallFunction, web3ContractInstance);
            } else {
                const cbStyleEstimateGasFunction = web3ContractInstance[functionAbi.name].estimateGas;
                this[functionAbi.name].estimateGas =
                    promisify(cbStyleEstimateGasFunction, web3ContractInstance);
            }
        });
    }
}
