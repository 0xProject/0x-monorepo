import { AbiEncoder } from '.';

export interface FunctionInfo {
    functionSignature: string;
    contractName?: string;
    contractAddress?: string;
    networkId?: number;
    abiEncoder?: AbiEncoder.Method;
}

export interface FunctionInfoBySelector {
    [index: string]: FunctionInfo[];
}

export interface TransactionData {
    functionName: string;
    functionSignature: string;
    functionArguments: any;
}
