import {schemas, SchemaValidator} from '@0xproject/json-schemas';
import promisify = require('es6-promisify');
import * as _ from 'lodash';
import * as Web3 from 'web3';

import {AbiType} from './types';

export class Contract implements Web3.ContractInstance {
    public address: string;
    public abi: Web3.ContractAbi;
    private contract: Web3.ContractInstance;
    private defaults: Partial<Web3.TxData>;
    private validator: SchemaValidator;
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
        this.validator = new SchemaValidator();
    }
    private populateFunctions(): void {
        const functionsAbi = _.filter(this.abi, abiPart => abiPart.type === AbiType.Function);
        _.forEach(functionsAbi, (functionAbi: Web3.MethodAbi) => {
            if (functionAbi.constant) {
                const cbStyleCallFunction = this.contract[functionAbi.name].call;
                this[functionAbi.name] = {
                    callAsync: promisify(cbStyleCallFunction, this.contract),
                };
            } else {
                const cbStyleFunction = this.contract[functionAbi.name];
                const cbStyleEstimateGasFunction = this.contract[functionAbi.name].estimateGas;
                const estimateGasAsync = promisify(cbStyleEstimateGasFunction, this.contract);
                this[functionAbi.name] = {
                    estimateGasAsync,
                    sendTransactionAsync: this.promisifyWithDefaultParams(cbStyleFunction, estimateGasAsync),
                };
            }
        });
    }
    private populateEvents(): void {
        const eventsAbi = _.filter(this.abi, abiPart => abiPart.type === AbiType.Event);
        _.forEach(eventsAbi, (eventAbi: Web3.EventAbi) => {
            this[eventAbi.name] = this.contract[eventAbi.name];
        });
    }
    private promisifyWithDefaultParams(
        web3CbStyleFunction: (...args: any[]) => void,
        estimateGasAsync: (...args: any[]) => Promise<number>,
    ): (...args: any[]) => Promise<any> {
        const promisifiedWithDefaultParams = async (...args: any[]) => {
            const promise = new Promise(async (resolve, reject) => {
                const lastArg = args[args.length - 1];
                let txData: Partial<Web3.TxData> = {};
                if (this.isTxData(lastArg)) {
                    txData = args.pop();
                }
                // Gas amounts priorities:
                // 1 - method level
                // 2 - Library defaults
                // 3 - estimate
                txData = {
                    ...this.defaults,
                    ...txData,
                };
                if (_.isUndefined(txData.gas)) {
                    const estimatedGas = await estimateGasAsync.apply(this.contract, [...args, txData]);
                    txData.gas = estimatedGas;
                }
                const callback = (err: Error, data: any) => {
                    if (_.isNull(err)) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                };
                args.push(txData);
                args.push(callback);
                web3CbStyleFunction.apply(this.contract, args);
            });
            return promise;
        };
        return promisifiedWithDefaultParams;
    }
    private isTxData(lastArg: any): boolean {
        const isValid = this.validator.isValid(lastArg, schemas.txDataSchema);
        return isValid;
    }
}
