import * as Web3 from 'web3';

export enum ParamKind {
    Input = 'input',
    Output = 'output',
}

export interface Method extends Web3.MethodAbi {
    singleReturnValue: boolean;
}

export interface ContextData {
    contractName: string;
    methods: Method[];
    events: Web3.EventAbi[];
}
