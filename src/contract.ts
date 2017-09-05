import * as Web3 from 'web3';
import * as _ from 'lodash';
import promisify = require('es6-promisify');

export class Contract implements Web3.ContractInstance {
    public address: string;
    public abi: Web3.ContractAbi;
    private contract: Web3.ContractInstance;
    private defaults: Partial<Web3.TxData>;
    // This class instance is going to be populated with functions and events depending on the ABI
    // and we don't know their types in advance
    [name: string]: any;
    constructor(web3ContractInstance: Web3.ContractInstance, defaults: Partial<Web3.TxData>) {
        this.contract = web3ContractInstance;
        this.address = web3ContractInstance.address;
        this.abi = web3ContractInstance.abi;
        this.defaults = defaults;
        this.populateEvents();
        this.populateFunctions();
    }
    private populateFunctions(): void {
        const functionsAbi = _.filter(this.abi, abiPart => abiPart.type === 'function');
        _.forEach(functionsAbi, (functionAbi: Web3.MethodAbi) => {
            if (functionAbi.constant) {
                const cbStyleCallFunction = this.contract[functionAbi.name].call;
                this[functionAbi.name] = {
                    callAsync: promisify(cbStyleCallFunction, this.contract),
                };
            } else {
                const cbStyleFunction = this.contract[functionAbi.name];
                const cbStyleEstimateGasFunction = this.contract[functionAbi.name].estimateGas;
                this[functionAbi.name] = {
                    estimateGasAsync: promisify(cbStyleEstimateGasFunction, this.contract),
                    sendTransactionAsync: this.promisifyWithDefaultParams(cbStyleFunction),
                };
            }
        });
    }
    private populateEvents(): void {
        const eventsAbi = _.filter(this.abi, abiPart => abiPart.type === 'event');
        _.forEach(eventsAbi, (eventAbi: Web3.EventAbi) => {
            this[eventAbi.name] = this.contract[eventAbi.name];
        });
    }
    private promisifyWithDefaultParams(fn: (...args: any[]) => void): (...args: any[]) => Promise<any> {
        const promisifiedWithDefaultParams = (...args: any[]) => {
            const promise = new Promise((resolve, reject) => {
                const lastArg = args[args.length - 1];
                let txData: Partial<Web3.TxData> = {};
                if (_.isObject(lastArg) && !_.isArray(lastArg) && !lastArg.isBigNumber) {
                    txData = args.pop();
                }
                txData = {
                    ...txData,
                    ...this.defaults,
                };
                const callback = (err: Error, data: any) => {
                    if (_.isNull(err)) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                };
                args.push(txData);
                args.push(callback);
                fn.apply(this.contract, args);
            });
            return promise;
        };
        return promisifiedWithDefaultParams;
    }
}
