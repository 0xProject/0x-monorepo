import * as Web3 from 'web3';
import * as _ from 'lodash';
import promisify = require('es6-promisify');

export class Contract implements Web3.ContractInstance {
    public address: string;
    public abi: Web3.ContractAbi;
    private contract: Web3.ContractInstance;
    [name: string]: any;
    constructor(web3ContractInstance: Web3.ContractInstance) {
        this.contract = web3ContractInstance;
        this.address = web3ContractInstance.address;
        this.abi = web3ContractInstance.abi;
        this.populateEvents();
        this.populateFunctions();
    }
    private populateFunctions(): void {
        const functionsAbi = _.filter(this.abi, abiPart => abiPart.type === 'function');
        _.forEach(functionsAbi, (functionAbi: Web3.MethodAbi) => {
            const cbStyleFunction = this.contract[functionAbi.name];
            this[functionAbi.name] = promisify(cbStyleFunction, this.contract);
            if (functionAbi.constant) {
                const cbStyleCallFunction = this.contract[functionAbi.name].call;
                this[functionAbi.name].call = promisify(cbStyleCallFunction, this.contract);
            } else {
                const cbStyleEstimateGasFunction = this.contract[functionAbi.name].estimateGas;
                this[functionAbi.name].estimateGas =
                    promisify(cbStyleEstimateGasFunction, this.contract);
            }
        });
    }
    private populateEvents(): void {
        const eventsAbi = _.filter(this.abi, abiPart => abiPart.type === 'event');
        _.forEach(eventsAbi, (eventAbi: Web3.EventAbi) => {
            this[eventAbi.name] = this.contract[eventAbi.name];
        });
    }
}
