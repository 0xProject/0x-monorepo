declare module 'ethers' {
    import { TxData } from 'ethereum-types';

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
    const enum errors {
        INVALID_ARGUMENT = 'INVALID_ARGUMENT',
    }

    export type ParamName = null | string | NestedParamName;

    export interface NestedParamName {
        name: string | null;
        names: ParamName[];
    }

    export const utils: {
        AbiCoder: {
            defaultCoder: AbiCoder;
        };
    };

    export interface AbiCoder {
        encode: (names: ParamName[] | string[], types: string[] | any[], args: any[] | undefined) => string;
        decode: (names: ParamName[] | string[], types: string[] | string, data: string | undefined) => any;
    }
}
