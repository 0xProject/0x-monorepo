import { AbiEncoder } from '.';

export interface FunctionInfo {
    functionSignature: string;
    contractName?: string;
    contractAddress?: string;
    networkId?: number;
    abiEncoder?: AbiEncoder.Method;
}

export interface SelectorToFunctionInfo {
    [index: string]: FunctionInfo[];
}

export interface DecodedCalldata {
    functionName: string;
    functionSignature: string;
    functionArguments: any;
}
