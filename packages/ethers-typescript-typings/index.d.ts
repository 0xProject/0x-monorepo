declare module 'ethers-contracts' {
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
    }
    export interface EventDescription {
        parse: (...args: any[]) => any;
        inputs: { names: string[]; types: string[] };
        signature: string;
        topic: string;
    }
    // tslint:disable-next-line:max-classes-per-file
    export class Interface {
        public functions: { [functionName: string]: FunctionDescription };
        public events: { [eventName: string]: EventDescription };
        public static decodeParams(types: string[], data: string): any[];
        constructor(abi: any);
    }
}
