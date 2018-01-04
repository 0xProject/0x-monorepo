import { schemas, SchemaValidator } from '@0xproject/json-schemas';
import { promisify } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { AbiType } from './types';

export class Contract implements Web3.ContractInstance {
    public address: string;
    public abi: Web3.ContractAbi;
    private _contract: Web3.ContractInstance;
    private _defaults: Partial<Web3.TxData>;
    private _validator: SchemaValidator;
    // This class instance is going to be populated with functions and events depending on the ABI
    // and we don't know their types in advance
    [name: string]: any;
    constructor(web3ContractInstance: Web3.ContractInstance, defaults: Partial<Web3.TxData>) {
        this._contract = web3ContractInstance;
        this.address = web3ContractInstance.address;
        this.abi = web3ContractInstance.abi;
        this._defaults = defaults;
        this._populateEvents();
        this._populateFunctions();
        this._validator = new SchemaValidator();
    }
    private _populateFunctions(): void {
        const functionsAbi = _.filter(this.abi, abiPart => abiPart.type === AbiType.Function) as Web3.FunctionAbi[];
        _.forEach(functionsAbi, (functionAbi: Web3.MethodAbi) => {
            if (functionAbi.constant) {
                const cbStyleCallFunction = this._contract[functionAbi.name].call;
                this[functionAbi.name] = {
                    callAsync: promisify(cbStyleCallFunction, this._contract),
                };
            } else {
                const cbStyleFunction = this._contract[functionAbi.name];
                const cbStyleEstimateGasFunction = this._contract[functionAbi.name].estimateGas;
                this[functionAbi.name] = {
                    estimateGasAsync: promisify(cbStyleEstimateGasFunction, this._contract),
                    sendTransactionAsync: this._promisifyWithDefaultParams(cbStyleFunction),
                };
            }
        });
    }
    private _populateEvents(): void {
        const eventsAbi = _.filter(this.abi, abiPart => abiPart.type === AbiType.Event) as Web3.EventAbi[];
        _.forEach(eventsAbi, (eventAbi: Web3.EventAbi) => {
            this[eventAbi.name] = this._contract[eventAbi.name];
        });
    }
    private _promisifyWithDefaultParams(fn: (...args: any[]) => void): (...args: any[]) => Promise<any> {
        const promisifiedWithDefaultParams = async (...args: any[]) => {
            const promise = new Promise((resolve, reject) => {
                const lastArg = args[args.length - 1];
                let txData: Partial<Web3.TxData> = {};
                if (this._isTxData(lastArg)) {
                    txData = args.pop();
                }
                txData = {
                    ...this._defaults,
                    ...txData,
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
                fn.apply(this._contract, args);
            });
            return promise;
        };
        return promisifiedWithDefaultParams;
    }
    private _isTxData(lastArg: any): boolean {
        const isValid = this._validator.isValid(lastArg, schemas.txDataSchema);
        return isValid;
    }
}
