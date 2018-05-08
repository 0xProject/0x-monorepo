declare module 'ethers' {
    import { TxData } from '@0xproject/types';

    export interface TransactionDescription {
        name: string;
        signature: string;
        sighash: string;
        data: string;
    }
    export interface CallDescription extends TransactionDescription {
        parse: (...args: any[]) => any;
    }
    export interface FunctionDescription {
        (...params: any[]): TransactionDescription | CallDescription;
        inputs: { names: string[]; types: string[] };
        outputs: { names: string[]; types: string[] };
        type: string;
    }
    export interface EventDescription {
        parse: (...args: any[]) => any;
        inputs: { names: string[]; types: string[] };
        signature: string;
        topics: string[];
    }
    export class Interface {
        public functions: { [functionName: string]: FunctionDescription };
        public events: { [eventName: string]: EventDescription };
        constructor(abi: any);
    }
    export class Contract {
        public static getDeployTransaction(bytecode: string, abi: any, ...args: any[]): Partial<TxData>;
        constructor(address: string, abi: any, provider: any);
    }
}
