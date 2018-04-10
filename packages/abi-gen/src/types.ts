import { EventAbi, MethodAbi } from '@0xproject/types';

export enum ParamKind {
    Input = 'input',
    Output = 'output',
}

export enum AbiType {
    Function = 'function',
    Constructor = 'constructor',
    Event = 'event',
    Fallback = 'fallback',
}

export enum ContractsBackend {
    Web3 = 'web3',
    Ethers = 'ethers',
}

export interface Method extends MethodAbi {
    singleReturnValue: boolean;
    hasReturnValue: boolean;
}

export interface ContextData {
    contractName: string;
    methods: Method[];
    events: EventAbi[];
}
