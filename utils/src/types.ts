import { AbiEncoder } from '.';
import { BigNumber } from './index';

export interface FunctionInfo {
    functionSignature: string;
    contractName?: string;
    contractAddress?: string;
    chainId?: number;
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

export type Numberish = BigNumber | string | number;
